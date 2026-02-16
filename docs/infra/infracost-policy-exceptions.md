# Infracost Policy Exceptions

This document defines how temporary Infracost policy exceptions are managed in this repository.

## Source of Truth

- Machine-readable exceptions: `infracost-policy-exceptions.yml`
- Risk tracking log: `docs/infra/risk-tracker.md`

Both files must be updated together.

## Active Exception: EC2.9 for API Host

- Exception ID: `ec2-9-aws-instance-api-public-ip`
- Project: `infra-terraform-api`
- Policy: `EC2.9`
- Resource: `aws_instance.api`
- Owner: `platform-engineering`
- Accepted on: `2026-02-16`
- Expires on: `2026-06-30`
- Tracking issue: `INFRA-EC2-9-PRIVATE-API-HOST`
- Reason: current MVP keeps API internet-facing by design (public subnet + EIP + Caddy).

## PR Handling for Infracost GitHub App

When this policy issue appears in a PR:

1. Use the Infracost GitHub App controls to dismiss or snooze only the `EC2.9` issue for `aws_instance.api`.
2. Add the exception ID (`ec2-9-aws-instance-api-public-ip`) and tracking issue (`INFRA-EC2-9-PRIVATE-API-HOST`) in the dismissal reason/comment.
3. Do not dismiss any other policy issue under this exception.

If command syntax is needed, run `@infracost help` in the PR thread.

## Renewal Rules

- The exception is invalid after `2026-06-30`.
- Any extension requires:
  - updated owner and justification,
  - new expiration date,
  - progress update in `docs/infra/risk-tracker.md`.
