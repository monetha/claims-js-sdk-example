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

      await this.sendAndWaitTx(walletAddress, tx.contractAddress, tx.getData());

      this.refreshCurrentAllowance();
    });
  }

  private onClearAllowance = async () => {
    this.runBlockchainOperation(async (walletAddress) => {
      const tx = this.claimManager.clearAllowanceTx();

      await this.sendAndWaitTx(walletAddress, tx.contractAddress, tx.getData());

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

      const receipt = await this.sendAndWaitTx(walletAddress, tx.contractAddress, tx.getData());

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

      await this.sendAndWaitTx(walletAddress, tx.contractAddress, tx.getData());

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

      await this.sendAndWaitTx(walletAddress, tx.contractAddress, tx.getData());

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

      await this.sendAndWaitTx(walletAddress, tx.contractAddress, tx.getData());

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
   * @param txData - transaction data
   */
  private async sendAndWaitTx(walletAddress: string, contractAddress: string, txData: string) {
    const rawTx = await prepareRawTX(walletAddress, contractAddress, txData);

    const txHash = await sendTransaction(rawTx);
    return waitForTxToFinish(txHash);
  }

  // #endregion
}

// #endregion
