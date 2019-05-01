import React from 'react';

// #region -------------- Interfaces -------------------------------------------------------------------

interface IProps {
  onSubmit(resolution: string);
}

interface IState {
  resolution: string;
}

// #endregion

// #region -------------- Component ---------------------------------------------------------------

export default class ClaimResolveForm extends React.Component<IProps, IState> {

  public constructor(props) {
    super(props);

    this.state = {
      resolution: null,
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
    const { resolution } = this.state;

    return (
      <div>
        <div className='field'>
          <label>Resolution</label>
          <div>
            <textarea
              onChange={this.onResolutionChange}
              value={resolution || ''}
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
        Resolve dispute
      </button>
    )
  }

  private onResolutionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      resolution: e.target.value,
    });
  }

  private isFormValid() {
    const { resolution } = this.state;

    if (!resolution || !resolution.trim()) {
      return false;
    }

    return true;
  }

  private onSubmit = () => {
    const { resolution } = this.state;

    this.props.onSubmit(resolution);
  }

  // #endregion
}

// #endregion