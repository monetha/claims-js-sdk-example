import React from 'react';

// #region -------------- Interfaces -------------------------------------------------------------------

interface IProps {
  currentAllowance: number;
  onClear();
  onApprove(amount: number);
  onRefresh();
}

interface IState {
  newAllowance: number;
}

// #endregion

// #region -------------- Component ---------------------------------------------------------------

export default class AllowanceForm extends React.Component<IProps, IState> {

  public constructor(props) {
    super(props);

    this.state = {
      newAllowance: 150,
    };
  }

  public render() {
    const { currentAllowance } = this.props;

    return (
      <div>
        <div className='field'>
          <label>Current MTH allowance</label>
          <div>{(currentAllowance > 0 || currentAllowance === 0) ? currentAllowance : '...'}</div>
        </div>

        {this.renderApproveInput()}

        {this.renderClearButton()}
        {this.renderApproveButton()}
        {this.renderRefreshButton()}
      </div>
    );
  }

  // #region -------------- Clearing -------------------------------------------------------------------

  private renderClearButton() {
    const { currentAllowance } = this.props;
    if (!currentAllowance) {
      return null;
    }

    return (
      <button
        type='button'
        onClick={this.onClear}
      >
        Clear
      </button>
    )
  }

  private onClear = () => {
    const { onClear } = this.props;

    if (onClear) {
      onClear();
    }
  }

  // #endregion

  // #region -------------- Approving -------------------------------------------------------------------

  private renderApproveInput() {
    const { currentAllowance } = this.props;
    if (currentAllowance !== 0) {
      return null;
    }

    const { newAllowance } = this.state;

    return (
      <div className='field'>
        <label>New allowance</label>
        <div>
          <input
            type='number'
            min={0}
            value={newAllowance || ''}
            onChange={this.onNewAllowanceChange}
          />
        </div>
      </div>
    )
  }

  private renderApproveButton() {
    const { currentAllowance } = this.props;
    if (currentAllowance !== 0) {
      return null;
    }

    const { newAllowance } = this.state;

    const isDisabled = !newAllowance;

    return (
      <button
        disabled={isDisabled}
        type='button'
        onClick={this.onApprove}
      >
        Approve
      </button>
    )
  }

  private onNewAllowanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newAllowance = parseInt(e.target.value);
    if (!newAllowance || newAllowance < 0) {
      newAllowance = null;
    }

    this.setState({
      newAllowance,
    });
  }

  private onApprove = () => {
    const { onApprove } = this.props;

    if (onApprove) {
      onApprove(this.state.newAllowance);
    }
  }

  // #endregion

  // #region -------------- Refreshing -------------------------------------------------------------------

  private renderRefreshButton() {
    return (
      <button
        type='button'
        onClick={this.props.onRefresh}
      >
        Refresh
      </button>
    )
  }

  // #endregion
}

// #endregion