import React from 'react';
import './style.scss';

// #region -------------- Interfaces --------------------------------------------------------------

export interface IPanel {
  isDisabled?: boolean;
  heading?: string;
  right?: boolean;
}

// #endregion

// #region -------------- Component ---------------------------------------------------------------

export const Panel: React.SFC<IPanel> = (props) => {
  const { children, heading, right, isDisabled } = props;

  return (
    <div className={`panel ${isDisabled ? 'disabled' : ''} ${right ? 'right' : ''}`}>
      {heading && (
        <h3>{heading}</h3>
      )}

      <div className='panel-contents'>
        {children}
      </div>
    </div>
  )
};

// #endregion
