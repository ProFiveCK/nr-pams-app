# Workflow API (Phase 1 Slice)

All endpoints require an authenticated session and role checks.

## 1. Submit Application
`POST /api/applications`

Body:
```json
{
  "permitType": "LANDING",
  "operatorName": "Pacific Air Connect",
  "operatorEmail": "ops@pacific.example",
  "aircraftRegistration": "C2-ABC",
  "flightPurpose": "Passenger service",
  "routeDetails": "NAN -> INU",
  "arrivalOrOverflightAt": "2026-05-10T08:00:00.000Z",
  "departureAt": "2026-05-10T12:00:00.000Z"
}
```

Allowed roles:
- APPLICANT
- ADMIN

## 2. Employee Review Actions
`PATCH /api/applications/:id/employee-review`

Body:
```json
{
  "action": "start-review",
  "notes": "Checklist complete"
}
```

Supported actions:
- `start-review`
- `request-correction`
- `forward-manager`

Allowed roles:
- EMPLOYEE
- ADMIN

## 3. Manager Review Actions
`PATCH /api/applications/:id/manager-review`

Body:
```json
{
  "action": "forward-minister",
  "notes": "Ready for decision"
}
```

Supported actions:
- `forward-minister`
- `return-employee`

Allowed roles:
- MANAGER
- ADMIN

## 4. Minister Decision
`PATCH /api/applications/:id/minister-decision`

Body:
```json
{
  "action": "approve",
  "notes": "Approved as requested"
}
```

Supported actions:
- `approve` (issues permit number and permit record)
- `reject`

Allowed roles:
- MINISTER
- ADMIN

## Audit Trail
Every successful status transition writes a record to `WorkflowEvent` with:
- actor
- fromStatus
- toStatus
- decision (if applicable)
- notes
- timestamp
