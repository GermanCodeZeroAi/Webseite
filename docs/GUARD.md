# Guard Layer Documentation

## Overview

The Guard Layer is a critical decision-making component in the email processing pipeline that determines whether an email can be automatically replied to or must be escalated for manual review. It acts as a safety gate, ensuring sensitive requests and edge cases are handled appropriately by human staff.

## Architecture

### Components

1. **Guard Policy** (`src/ai/guard/policy.ts`)
   - Core policy engine that evaluates emails against defined rules
   - Returns binary decision: auto-reply allowed or escalation required
   - Provides detailed reasons and flags for escalation decisions

2. **Guard Decision Maker** (`src/pipeline/decide/guard.ts`)
   - Pipeline integration layer
   - Manages state transitions and event logging
   - Updates email metadata with escalation information
   - Provides batch processing and statistics

## Policy Rules

The Guard Layer evaluates emails against the following rules in priority order:

### 1. Foreign Language Detection (Highest Priority)
- **Trigger**: Presence of language-related flags
- **Flags**: `FOREIGN_LANGUAGE`, `NON_GERMAN`, `TRANSLATION_NEEDED`
- **Action**: Immediate escalation
- **Reason**: `language`
- **Example**: Email in English requesting appointment

### 2. Sensitive Category Detection
- **Trigger**: Classification matches sensitive categories
- **Categories**:
  - `rezept` / `prescription` - Prescription requests
  - `au_anfrage` / `sick_note_request` - Sick note requests
  - `arbeitsunfähigkeit` - Work inability certificates
  - `mixed_intent` / `mehrfachanfrage` - Multiple requests in one email
  - `unclear_intent` - Ambiguous requests
- **Action**: Escalation
- **Reason**: `sensitive_{category}`
- **Example**: "Ich brauche ein Rezept für Antibiotika"

### 3. Mixed Intent Detection
- **Trigger**: Multiple requests or unclear intent
- **Indicators**:
  - Classification contains "mixed" or "mehrfach"
  - Flags: `MIXED_INTENT`, `MULTIPLE_REQUESTS`, `MEHRFACHANFRAGE`
- **Action**: Escalation
- **Reason**: `mixed_intent`
- **Example**: "Ich möchte einen Termin und brauche auch ein Rezept"

### 4. Low Confidence Check
- **Trigger**: Classification confidence below threshold
- **Default Threshold**: 0.95 (configurable)
- **Action**: Escalation
- **Reason**: `low_confidence_{score}`
- **Example**: Ambiguous email with 0.85 confidence score

### 5. Knowledge Base Policy Violations
- **Trigger**: KB policy flags requiring special handling
- **Checks**:
  - `requiresDoctor: true` → `requires_doctor_attention`
  - `requiresPrivacyCheck: true` → `requires_privacy_check`
  - `complexityScore > 0.8` → `high_complexity`
- **Action**: Escalation
- **Example**: Complex medical question requiring doctor's expertise

### 6. System Settings
- **Auto-Send Disabled**: Global setting preventing all auto-replies
- **Manual Approval Required**: Forces all emails through manual review
- **Action**: Escalation
- **Reasons**: `auto_send_disabled`, `manual_approval`

## Policy Decision Matrix

| Scenario | Classification | Confidence | Flags | Decision | Reason |
|----------|----------------|------------|-------|----------|---------|
| German appointment request | `appointment_request` | 0.98 | `[]` | ✅ Auto | `all_checks_passed` |
| English email | `appointment_request` | 0.99 | `['FOREIGN_LANGUAGE']` | ❌ Escalate | `language` |
| Prescription request | `rezept_anfrage` | 0.97 | `[]` | ❌ Escalate | `sensitive_rezept_anfrage` |
| Sick note request | `au_anfrage` | 0.98 | `[]` | ❌ Escalate | `sensitive_au_anfrage` |
| Mixed request | `mixed_intent` | 0.96 | `[]` | ❌ Escalate | `mixed_intent` |
| Low confidence | `appointment_request` | 0.85 | `[]` | ❌ Escalate | `low_confidence_0.85` |
| Multiple topics | `general_inquiry` | 0.97 | `['MIXED_INTENT']` | ❌ Escalate | `mixed_intent` |
| Complex medical | `medical_inquiry` | 0.98 | `[]` + KB policy | ❌ Escalate | `requires_doctor_attention` |

## State Management

### Email State Transitions

1. **Before Guard**: `classified`, `enriched`, or other processing states
2. **Guard Decision**:
   - **Auto-Reply Allowed**: State remains unchanged, proceeds to draft generation
   - **Escalation Required**: State changes to `ESCALATED`

### Escalation Metadata

When an email is escalated, the following metadata is added:

```json
{
  "state": "ESCALATED",
  "escalatedAt": "2025-01-20T10:30:00Z",
  "escalationReason": "sensitive_rezept_anfrage",
  "escalationFlags": ["SENSITIVE_CATEGORY"],
  "guardDecision": {
    "timestamp": "2025-01-20T10:30:00Z",
    "reason": "sensitive_rezept_anfrage",
    "flags": ["SENSITIVE_CATEGORY"]
  }
}
```

## Event Logging

The Guard Layer logs detailed events for monitoring and auditing:

### Event Types

1. **GUARD_APPROVED**: Email approved for auto-reply
   ```json
   {
     "emailId": 123,
     "klass": "appointment_request",
     "confidence": 0.98,
     "decision": "auto_reply"
   }
   ```

2. **ESCALATED**: Email requires manual review
   ```json
   {
     "emailId": 456,
     "klass": "rezept_anfrage",
     "confidence": 0.96,
     "decision": "escalate",
     "escalationReason": "sensitive_rezept_anfrage",
     "escalationFlags": ["SENSITIVE_CATEGORY"]
   }
   ```

3. **EMAIL_ESCALATED**: State transition event
   ```json
   {
     "emailId": 456,
     "reason": "sensitive_rezept_anfrage",
     "flags": ["SENSITIVE_CATEGORY"],
     "previousState": "classified",
     "newState": "ESCALATED"
   }
   ```

## Configuration

### Settings

Configure the Guard Layer through the settings system:

```typescript
// Auto-send configuration
praxisSettings.autoSendEnabled = true;
praxisSettings.autoSendConfidenceThreshold = 0.95;
praxisSettings.requireManualApproval = false;
```

### Customizing Sensitive Categories

To add new sensitive categories, update the `SENSITIVE_CATEGORIES` array in `policy.ts`:

```typescript
const SENSITIVE_CATEGORIES = [
  'rezept',
  'prescription',
  'au_anfrage',
  // Add new categories here
];
```

### Customizing Language Flags

To support additional language detection flags:

```typescript
const FOREIGN_LANGUAGE_FLAGS = [
  'FOREIGN_LANGUAGE',
  'NON_GERMAN',
  'TRANSLATION_NEEDED',
  // Add new flags here
];
```

## Usage Examples

### Basic Usage

```typescript
import { guardDecisionMaker } from './src/pipeline/decide/guard.js';

const context = {
  emailId: 123,
  klass: 'appointment_request',
  confidence: 0.98,
  flags: [],
  details: { type: 'routine_checkup' },
  state: 'classified'
};

const decision = await guardDecisionMaker.decide(context);

if (decision.shouldAutoReply) {
  // Proceed with auto-reply
  console.log('Auto-reply approved');
} else {
  // Email has been escalated
  console.log(`Escalated: ${decision.escalationReason}`);
}
```

### Batch Processing

```typescript
const contexts = [
  { emailId: 1, klass: 'appointment_request', confidence: 0.98, ... },
  { emailId: 2, klass: 'rezept_anfrage', confidence: 0.96, ... },
  { emailId: 3, klass: 'general_inquiry', confidence: 0.99, ... }
];

const decisions = await guardDecisionMaker.decideBatch(contexts);

decisions.forEach(decision => {
  console.log(`Email ${decision.emailId}: ${decision.shouldAutoReply ? 'Auto' : 'Escalated'}`);
});
```

### Getting Statistics

```typescript
const stats = await guardDecisionMaker.getStatistics({
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31')
});

console.log(`Approval Rate: ${(stats.approvalRate * 100).toFixed(1)}%`);
console.log(`Top Escalation Reasons:`, stats.escalationReasons);
```

## Testing

The Guard Layer includes comprehensive tests covering all scenarios:

```bash
# Run guard tests
npm test test/unit/ai/guard/policy.test.ts
npm test test/unit/pipeline/decide/guard.test.ts
```

Test scenarios include:
- Foreign language detection
- Sensitive category detection (prescriptions, sick notes)
- Mixed intent handling
- Low confidence thresholds
- System setting overrides
- Error handling and fallbacks

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Escalation Rate**: Percentage of emails being escalated
2. **Escalation Reasons**: Distribution of why emails are escalated
3. **Processing Time**: Guard decision latency
4. **Error Rate**: Failed guard evaluations

### Recommended Alerts

1. **High Escalation Rate**: > 50% emails being escalated
2. **Guard Errors**: Any guard evaluation failures
3. **Performance**: Decision time > 100ms

## Best Practices

1. **Regular Review**: Periodically review escalation reasons to identify patterns
2. **Threshold Tuning**: Adjust confidence threshold based on accuracy metrics
3. **Category Updates**: Keep sensitive categories current with business needs
4. **Testing**: Add tests for new escalation scenarios
5. **Monitoring**: Track escalation rates and reasons for continuous improvement

## Troubleshooting

### Common Issues

1. **Too Many Escalations**
   - Check confidence threshold settings
   - Review classification accuracy
   - Verify language detection flags

2. **Sensitive Emails Auto-Replied**
   - Ensure category list is comprehensive
   - Check for classification mismatches
   - Verify guard is active in pipeline

3. **Performance Issues**
   - Use batch processing for multiple emails
   - Check database query performance
   - Monitor event logging overhead

## Future Enhancements

1. **Machine Learning Integration**: Learn from manual review decisions
2. **Dynamic Thresholds**: Adjust thresholds based on email patterns
3. **Custom Rules Engine**: Allow business rules configuration
4. **A/B Testing**: Test different policy configurations
5. **Escalation Routing**: Route to specific staff based on category