export default function BookingStepper({ status = '', language = 'en' }) {
  const isTe = language === 'te';

  const steps = [
    { key: 'Requested', label: isTe ? '1. అభ్యర్థించబడింది' : '1. Requested', icon: '📝' },
    { key: 'Confirmed', label: isTe ? '2. స్లాట్ ఖరారైంది' : '2. Slot Confirmed', icon: '✓' },
    { key: 'In Progress', label: isTe ? '3. పొలంలో పని' : '3. In Field', icon: '⚙️' },
    { key: 'Completed', label: isTe ? '4. పూర్తయింది' : '4. Completed', icon: '🌾' },
  ];

  if (status === 'Cancelled') {
    return (
      <div className="stepper-cancelled-pill">
        <span>✕ {isTe ? 'ఈ బుకింగ్ రైతు ద్వారా రద్దు చేయబడింది' : 'This booking was cancelled'}</span>
      </div>
    );
  }

  if (status.includes('Declined') || status.includes('Reject') || status === 'Rejected') {
    return (
      <div className="stepper-cancelled-pill" style={{ background: '#ffebee', color: '#c62828', borderColor: '#ef9a9a' }}>
        <span>❌ {isTe ? 'యజమాని ఈ స్లాట్‌ను తిరస్కరించారు • దయచేసి వేరే తేదీ లేదా ట్రాక్టర్‌ను ఎంచుకోండి' : 'Booking rejected by tractor owner • Please pick another slot or unit'}</span>
      </div>
    );
  }

  if (status.includes('Proposed')) {
    return (
      <div className="stepper-cancelled-pill" style={{ background: '#fff3e0', color: '#e65100', borderColor: '#ffcc80' }}>
        <span>⏳ {isTe ? 'యజమాని సూచన: ఈ తేదీన బిజీ, మరుసటి రోజు ఉదయం పని చేయగలరు' : 'Owner Note: Busy on requested date, available on the next day!'}</span>
      </div>
    );
  }

  const getStepIndex = (curStatus) => {
    switch (curStatus) {
      case 'Completed':
        return 3;
      case 'In Progress':
        return 2;
      case 'Approved':
      case 'Confirmed':
        return 1;
      default: // 'Pending Approval'
        return 0;
    }
  };

  const currentIdx = getStepIndex(status);

  return (
    <div className="booking-stepper">
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <div key={step.key} className={`stepper-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
            <div className="stepper-bubble">
              {isDone ? '✓' : step.icon}
            </div>
            <span className="stepper-label">{step.label}</span>
            {idx < steps.length - 1 && (
              <div className={`stepper-line ${idx < currentIdx ? 'filled' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
