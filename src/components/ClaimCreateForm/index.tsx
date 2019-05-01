import React from 'react';
import { ICreateClaimPayload } from 'claims-sdk/dist/claims/ClaimManager';
import { BigNumber } from 'bignumber.js';

// #region -------------- Interfaces -------------------------------------------------------------------

interface IProps {
  currentAllowance: number;
  onSubmit(claimData: ICreateClaimPayload);
}

interface IState {
  stake: number;
  dealId: number;
  reason: string;
  requesterId: string;
  respondentId: string;
}

// #endregion

// #region -------------- Component ---------------------------------------------------------------

export default class ClaimCreateForm extends React.Component<IProps, IState> {

  public constructor(props) {
    super(props);

    this.state = {
      stake: 150,
      dealId: null,
      reason: null,
      requesterId: null,
      respondentId: null,
    };
  }

  public render() {

    return (
      <div>
        {this.renderFields()}
        {this.renderSubmitButton()}
      </div>
    );
  }

  private renderFields() {
    const { stake, dealId, reason, requesterId, respondentId } = this.state;

    return (
      <div>
        <div className='field'>
          <label>MTH tokens to stake</label>
          <div>
            <input
              min={150}
              max={this.props.currentAllowance}
              type='number'
              value={stake || ''}
              onChange={this.onStakeChange}
            />
          </div>
        </div>

        <div className='field'>
          <label>Deal ID</label>
          <div>
            <input
              min={0}
              type='number'
              value={dealId || ''}
              onChange={this.onDealIdChange}
            />
          </div>
        </div>

        <div className='field'>
          <label>Requester ID</label>
          <div>
            <input
              type='text'
              value={requesterId || ''}
              onChange={this.onRequesterIdChange}
            />
          </div>
        </div>

        <div className='field'>
          <label>Respondent ID</label>
          <div>
            <input
              type='text'
              value={respondentId || ''}
              onChange={this.onRespondentIdChange}
            />
          </div>
        </div>

        <div className='field'>
          <label>Reason</label>
          <div>
            <textarea
              onChange={this.onReasonChange}
              value={reason || ''}
            />
          </div>
        </div>
      </div>
    )
  }


  private renderSubmitButton() {
    return (
      <button
        disabled={!this.isFormValid()}
        type='button'
        onClick={this.onSubmit}
      >
        Open dispute
      </button>
    )
  }

  // #region -------------- Change events -------------------------------------------------------------------

  private onStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { currentAllowance } = this.props;

    // Minimum stake is 150
    let newStake = parseInt(e.target.value);
    if (!newStake || newStake < 150) {
      newStake = 150;
    }

    // Stake cannot be higher than it is allowed to be transfered to claims handler contract
    if (newStake > currentAllowance && currentAllowance > 150) {
      newStake = currentAllowance;
    }

    this.setState({
      stake: newStake,
    });
  }

  private onDealIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newDealId = parseInt(e.target.value);
    if (!newDealId || newDealId < 0) {
      newDealId = null;
    }

    this.setState({
      dealId: newDealId,
    });
  }

  private onReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      reason: e.target.value,
    });
  }

  private onRequesterIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      requesterId: e.target.value,
    });
  }

  private onRespondentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      respondentId: e.target.value,
    });
  }

  // #endregion

  private isFormValid() {
    const { stake, dealId, reason, requesterId, respondentId } = this.state;
    const { currentAllowance } = this.props;

    // Stake must be at least 150 MTH and not exceeding allowance
    if (!stake || !(stake >= 150) || stake > currentAllowance) {
      return false;
    }

    if ((!dealId && dealId !== 0) || !(dealId >= 0)) {
      return false;
    }

    if (!reason || !reason.trim()) {
      return false;
    }

    if (!requesterId || !requesterId.trim()) {
      return false;
    }

    if (!respondentId || !respondentId.trim()) {
      return false;
    }

    return true;
  }

  private onSubmit = () => {
    const { stake, dealId, reason, requesterId, respondentId } = this.state;

    const claim: ICreateClaimPayload = {
      dealId,
      reason,
      requesterId,
      respondentId,
      tokens: new BigNumber(stake),
    }

    this.props.onSubmit(claim);
  }

  // #endregion
}

// #endregion