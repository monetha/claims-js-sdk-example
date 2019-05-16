import BigNumber from 'bignumber.js';
import { ClaimManager, ClaimStatus, getClaimIdFromCreateTXReceipt, IClaim } from 'claims-sdk';
import { ICreateClaimPayload } from 'claims-sdk/dist/claims/ClaimManager';
import moment from 'moment';
import React from 'react';
import { claimsHandlerContractAddress, monethaTokenContractAddress } from 'src/constants/constants';
import 'src/style/index.scss';
import { enableMetamask, getCurrentAccountAddress, sendTransaction } from 'src/utils/metamask';
import { getWeb3, prepareRawTX, waitForTxToFinish } from 'src/utils/web3';
import AllowanceForm from '../AllowanceForm';
import ClaimCreateForm from '../ClaimCreateForm';
import { ClaimInfo } from '../ClaimInfo';
import ClaimResolveForm from '../ClaimResolveForm';
import { Loader } from '../Loader';
import { Panel } from '../Panel';
import { SidedContainer } from '../SidedContainer';
import './style.scss';

// #region -------------- Interfaces -------------------------------------------------------------------

interface IState {
  isLoading: boolean;
  claim: IClaim;
  allowance: number;
}

// #endregion

// #region -------------- Component ---------------------------------------------------------------

export default class App extends React.Component<{}, IState> {

  private claimManager: ClaimManager;

  public constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      claim: null,
      allowance: null,
    };

    this.claimManager = new ClaimManager({ claimsHandlerContractAddress, monethaTokenContractAddress, web3: getWeb3() });
  }

  public componentDidMount() {
    this.refreshCurrentAllowance();

    // Load dispute from previous session
    const claimIdStr = window.localStorage.getItem('claim_id');
    if (claimIdStr) {
      this.loadClaim(parseInt(claimIdStr));
    }
  }

  public render() {
    return (
      <div className='container'>
        <h1>Dispute flow example</h1>

        <div className='description main-description'>
          This example illustrates usage of Monetha's decentralized dispute management SDK (claims-sdk).<br/><br />

          Requirements to proceed with example:<br/>
          - Metamask chrome extension must be installed<br/>
          - You have to have two Ropsten wallets in Metamask with at least 150 MTH tokens and some ETH for fees in each
        </div>

        {this.renderCurrentDispute()}

        <h2>Requester</h2>
        {this.renderCreateDisputeSection()}

        <SidedContainer right><h2>Respondent</h2></SidedContainer>
        {this.renderAcceptDisputeSection()}
        {this.renderResolveDisputeSection()}

        <h2>Requester</h2>
        {this.renderCloseDisputeSection()}

        {this.renderLoader()}
      </div>
    );
  }

  // #region -------------- Claim loading -------------------------------------------------------------------

  private loadClaim = async (claimId: number) => {
    this.runBlockchainOperation(async () => {
      const claim = await this.claimManager.getClaim(claimId);

      this.setState({ claim });
    });
  }

  // #endregion

  // #region -------------- Token approval -------------------------------------------------------------------

  private renderMTHAllowanceForm() {
    const { allowance } = this.state;

    return (
      <div className='allowance-form-container'>
        <Panel>
          <AllowanceForm
            currentAllowance={allowance}
            onApprove={this.onApproveAllowance}
            onClear={this.onClearAllowance}
            onRefresh={this.refreshCurrentAllowance}
          />
        </Panel>
      </div>
    );
  }

  private refreshCurrentAllowance = async () => {
    this.runBlockchainOperation(async (walletAddress) => {
      const allowance = await this.claimManager.getAllowance(walletAddress)

      this.setState({ allowance: allowance.toNumber() });
    });

  }

  private onApproveAllowance = (tokens: number) => {
    this.runBlockchainOperation(async (walletAddress) => {
      const tx = this.claimManager.allowTx(new BigNumber(tokens));

      await this.sendAndWaitTx(walletAddress, claimsHandlerContractAddress, tx);

      this.refreshCurrentAllowance();
    });
  }

  private onClearAllowance = async () => {
    this.runBlockchainOperation(async (walletAddress) => {
      const tx = this.claimManager.clearAllowanceTx();

      await this.sendAndWaitTx(walletAddress, claimsHandlerContractAddress, tx);

      this.refreshCurrentAllowance();
    });
  }

  // #endregion

  // #region -------------- Current dispute -------------------------------------------------------------------

  private renderCurrentDispute() {
    const { claim } = this.state;
    if (!claim) {
      return null;
    }

    return (
      <div className='current-dispute'>
        <Panel>
          <ClaimInfo claim={claim} />
        </Panel>
      </div>
    );
  }

  // #endregion

  // #region -------------- Create dispute -------------------------------------------------------------------

  private renderCreateDisputeSection() {
    return (
      <SidedContainer>
        <Panel
          heading='Create dispute'
        >
          <div className='description'>
            To create a dispute, please fill in the dispute form below and click "Open dispute".<br/>
            Opening a dispute will transfer (stake) selected amount of MTH tokens from your wallet in Metamask to claims
            handler contract.<br/><br/>

            A minimum amount to stake is 150 MTH.<br/><br/>

            Deal ID, Requester ID and Respondent ID fields can have any values which allows tracking claimed deals and dispute
            participants in third party systems. For example, when disputes are used in e-shops, "Deal ID" could be shop order's ID and
            "Requester ID" / "Respondent ID" could be order's buyer and seller IDs<br/><br/>

            In order for transaction to succeed, make sure there is enough allowance in Monetha token contract
            to transfer selected amount of tokens from your wallet to claims handler contract. You can check and set allowance using the box below.
          </div>

          {this.renderMTHAllowanceForm()}
          {this.renderClaimCreateForm()}
        </Panel>
      </SidedContainer>
    )
  }

  private renderClaimCreateForm() {
    const { allowance } = this.state;

    return (
      <div>
        <ClaimCreateForm
          currentAllowance={allowance}
          onSubmit={this.onCreateClaim}
        />
      </div>
    );
  }

  private onCreateClaim = (claim: ICreateClaimPayload) => {
    this.runBlockchainOperation(async (walletAddress) => {
      const tx = this.claimManager.createTx(claim);

      const receipt = await this.sendAndWaitTx(walletAddress, claimsHandlerContractAddress, tx);

      // This helper allows us extracting claim ID from transaction receipt
      const claimId = getClaimIdFromCreateTXReceipt(receipt);

      // Save claim ID in local storage so that we would not lose claim after page refresh
      window.localStorage.setItem('claim_id', claimId.toString());

      await this.loadClaim(claimId);

      this.refreshCurrentAllowance();
    });
  }

  // #endregion

  // #region -------------- Accept dispute -------------------------------------------------------------------

  private renderAcceptDisputeSection() {
    const { claim, allowance } = this.state;

    // Dispute must be in awaiting acceptance state to be accepted
    // Also, respondent must have enough MTH tokens allowed to be transfered to claims handler contract
    const isPanelDisabled = !claim || claim.stateId !== ClaimStatus.AwaitingAcceptance;
    const isButtonDisabled = !claim || claim.requesterStaked.gt(allowance || 0);

    return (
      <SidedContainer right>
        <Panel
          heading='Accept dispute'
          isDisabled={isPanelDisabled}
          right
        >
          <div className='description'>
            A dispute can be accepted when it is in "AwaitingAcceptance" state.<br /><br />

            To accept a dispute - please select a different wallet in metamask (for respondent) and click "Accept dispute". Accepting a dispute
            will transfer (stake) the same amount of MTH tokens from selected wallet to claims handler contract.<br /><br />

            Again, as with dispute creation, make sure there is enough allowance to transfer tokens. Use the box below to ensure that.
          </div>

          {this.renderMTHAllowanceForm()}

          <button
            disabled={isButtonDisabled}
            type='button'
            onClick={this.onAcceptClaim}
          >
            Accept dispute
          </button>
        </Panel>
      </SidedContainer>
    )
  }

  private onAcceptClaim = () => {
    const { claim } = this.state;

    this.runBlockchainOperation(async (walletAddress) => {
      if (claim.requesterAddress === walletAddress) {
        throw new Error('Please select different wallet for respondent in Metamask. It cannot be the same as requester\'s');
      }

      const tx = this.claimManager.acceptTx(claim.id);

      await this.sendAndWaitTx(walletAddress, claimsHandlerContractAddress, tx);

      await this.loadClaim(claim.id);

      this.refreshCurrentAllowance();
    });
  }

  // #endregion

  // #region -------------- Resolve dispute -------------------------------------------------------------------

  private renderResolveDisputeSection() {
    const { claim } = this.state;

    const isDisabled = !claim || claim.stateId !== ClaimStatus.AwaitingResolution;

    return (
      <SidedContainer right>
        <Panel
          heading='Resolve dispute'
          isDisabled={isDisabled}
          right
        >
          <div className='description'>
            A dispute can be resolved when it is in "AwaitingResolution" state.<br /><br />

            To resolve a dispute - please enter the resolution note, make sure that respondent's wallet is still
            selected in Metamask and click "Resolve dispute".<br /><br />

            After resolution, respondent's staked MTH tokens will be transferred back to respondent's wallet.
          </div>

          <ClaimResolveForm
            onSubmit={this.onResolveClaim}
          />
        </Panel>
      </SidedContainer>
    )
  }

  private onResolveClaim = (resolution: string) => {
    const { claim } = this.state;

    this.runBlockchainOperation(async (walletAddress) => {
      if (claim.respondentAddress !== walletAddress) {
        throw new Error('Please select respondent\'s wallet in Metamask');
      }

      const tx = this.claimManager.resolveTx(claim.id, resolution);

      await this.sendAndWaitTx(walletAddress, claimsHandlerContractAddress, tx);

      await this.loadClaim(claim.id);
    });
  }


  // #endregion

  // #region -------------- Close dispute -------------------------------------------------------------------

  private renderCloseDisputeSection() {
    const { claim } = this.state;
    let isDisabled = true;

    if (claim) {
      const hoursElapsed = moment().diff(claim.modifiedAt, 'hours');

      switch (claim.stateId) {
        case ClaimStatus.AwaitingConfirmation:
          isDisabled = false;
          break;

        case ClaimStatus.AwaitingAcceptance:
        case ClaimStatus.AwaitingResolution:
          isDisabled = hoursElapsed < 72;
          break;
      }
    }

    return (
      <SidedContainer>
        <Panel
          heading='Close dispute'
          isDisabled={isDisabled}
        >
          <div className='description'>
            A dispute can be closed when it is in: <br/>
            - "AwaitingConfirmation" state<br/>
            - "AwaitingAcceptance" state and 72 hours has passed since opening<br/>
            - "AwaitingResolution" state and 72 hours has passed since acceptance<br/><br/>

            To close a dispute - please select back the requester's wallet in Metamask and click "Close dispute".<br /><br />

            After closing, requester's staked MTH tokens will be transferred back to requester's wallet.<br />
            In case when dispute is in "AwaitingResolution" state and 72 hours has passed, closing will cause respondent's staked MTH tokens
            to be transferred to requester's wallet as well.
          </div>

          <button
            type='button'
            onClick={this.onCloseClaim}
          >
            Close dispute
          </button>
        </Panel>
      </SidedContainer>
    )
  }

  private onCloseClaim = () => {
    const { claim } = this.state;

    this.runBlockchainOperation(async (walletAddress) => {
      if (claim.requesterAddress !== walletAddress) {
        throw new Error('Please select requester\'s wallet in Metamask');
      }

      const tx = this.claimManager.closeTx(claim.id);

      await this.sendAndWaitTx(walletAddress, claimsHandlerContractAddress, tx);

      await this.loadClaim(claim.id);
    });
  }

  // #endregion

  // #region -------------- Other -------------------------------------------------------------------

  private renderLoader() {
    const { isLoading } = this.state;

    if (!isLoading) {
      return null;
    }

    return (
      <Loader />
    );
  }

  private onError(e: Error) {
    console.error(e);
    alert(e.message);
  }

  /**
   * helper which ensures metamask is enabled and receives currently selected wallet address.
   * This address is then passed to `operation` to be ran.
   * Also handles errors and loading status for the operation
   */
  private async runBlockchainOperation(operation: (walletAddress: string) => Promise<any>) {
    this.setState({ isLoading: true });

    try {
      await enableMetamask();
      const walletAddress = getCurrentAccountAddress();
      if (!walletAddress) {
        throw new Error('No wallet selected');
      }

      await operation(walletAddress);

    } catch (e) {
      this.onError(e);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Helper which sends transaction using metamask and waits for it to finish. It also handles gas and nonce estimations.
   * @param walletAddress - wallet address which is used for sending transaction
   * @param contractAddress - contract address on which operation will run
   * @param tx - transaction data
   */
  private async sendAndWaitTx(walletAddress: string, contractAddress: string, tx: any) {
    const rawTx = await prepareRawTX(walletAddress, contractAddress, tx);
    const txHash = await sendTransaction(rawTx);
    return waitForTxToFinish(txHash);
  }

  // #endregion
}

// #endregion
