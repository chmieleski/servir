# Infra Risk Tracker

This file tracks accepted temporary infra risks that require follow-up changes.

## Active Risks

| ID | Title | Status | Owner | Accepted On | Expires On | Tracking Issue |
| --- | --- | --- | --- | --- | --- | --- |
| INFRA-EC2-9-PRIVATE-API-HOST | EC2.9 exception for `aws_instance.api` in `infra-terraform-api` | Accepted temporary risk | platform-engineering | 2026-02-16 | 2026-06-30 | Create/maintain GitHub issue: `INFRA-EC2-9-PRIVATE-API-HOST` |

## Exit Criteria for `INFRA-EC2-9-PRIVATE-API-HOST`

- API instance runs in a private subnet.
- `associate_public_ip_address = false` on `aws_instance.api`.
- No EIP is attached directly to `aws_instance.api`.
- Public ingress is provided by ALB and TLS is terminated with ACM.
- Deploy via SSM continues to work for the private instance.
