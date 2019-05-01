import React from 'react';
import { IClaim, ClaimStatus } from 'claims-sdk';
import moment from 'moment';

interface IProps {
  claim: IClaim;
}

export const ClaimInfo: React.SFC<IProps> = (props) => {
  const { claim } = props;
  if (!claim) {
    return null;
  }

  return (
    <div className='claim-info'>
      <h3>Current dispute</h3>

      {renderField('Id', claim.id.toString())}
      {renderField('State', ClaimStatus[claim.stateId])}
      {renderField('Deal ID', claim.dealId.toString())}
      {renderField('Modified at', moment(claim.modifiedAt).format())}
      {renderField('Requester ID', claim.requesterId)}
      {renderField('Respondent ID', claim.respondentId)}
      {renderField('Requester address', claim.requesterAddress)}
      {renderField('Respondent address', claim.respondentAddress)}
      {renderField('Staked MTH', claim.requesterStaked.toString())}
      {renderField('Reason', claim.reasonNote)}
      {renderField('Resolution', claim.resolutionNote)}
    </div>
  );
}

function renderField(label: string, value: string) {
  return (
    <div className='field'>
      <label>{label}</label>
      <div className='value'>{value}</div>
    </div>
  )
}