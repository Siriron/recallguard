const STATUS_META = {
  ACTIVE: { label: 'Accepting stakes', tone: 'amber' },
  EVIDENCE_CLOSED: { label: 'Evidence closed — pending adjudication', tone: 'amber' },
  ADJUDICATED: { label: 'Adjudicated', tone: 'teal' },
  CANCELLED: { label: 'Cancelled', tone: 'ink' },
  INVALID: { label: 'Timed out — refundable', tone: 'ink' },
};

const CONCLUSION_META = {
  DEFECT_CONFIRMED: { label: 'Defect confirmed', tone: 'rust' },
  ALREADY_RECALLED: { label: 'Already recalled', tone: 'amber' },
  NOT_A_DEFECT: { label: 'Not a defect', tone: 'teal' },
  CLAIM_UNSUPPORTED: { label: 'Claim unsupported', tone: 'ink' },
  EVIDENCE_INSUFFICIENT: { label: 'Evidence insufficient', tone: 'ink' },
  INCONCLUSIVE: { label: 'Inconclusive', tone: 'ink' },
  QUESTION_INVALID: { label: 'Question invalid', tone: 'ink' },
};

export default function StatusTag({ status, conclusion }) {
  const meta =
    conclusion && CONCLUSION_META[conclusion]
      ? CONCLUSION_META[conclusion]
      : STATUS_META[status] || { label: status, tone: 'ink' };

  return <span className={`status-tag tone-${meta.tone}`}>{meta.label}</span>;
}
