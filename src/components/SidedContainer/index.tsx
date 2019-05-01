import React from 'react';
import './style.scss';

// #region -------------- Interfaces --------------------------------------------------------------

export interface IProps {
  right?: boolean;
}

// #endregion

// #region -------------- Component ---------------------------------------------------------------

export const SidedContainer: React.SFC<IProps> = (props) => {
  const { children, right } = props;

  return (
    <div className={`sided-container ${right ? 'right' : ''}`}>
      <div>
        {children}
      </div>
    </div>
  )
};

// #endregion
