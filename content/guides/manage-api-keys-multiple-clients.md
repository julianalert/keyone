---
title: "How to Manage API Keys for Multiple Clients: An Agency Guide"
seoTitle: "How to Manage API Keys for Multiple Clients"
description: "Learn how to manage API keys for multiple clients, choose account ownership, organise access and standardise onboarding, rotation and offboarding."
published: 2026-09-27
icon: key
author: Carine
authorImage: /carine.jpeg
---
One client needs OpenAI. Another uses Anthropic and a search API. A third has six automations, two environments and credentials created by someone who no longer works with you.

The problem is no longer creating API keys. It is knowing which key belongs to which client, where it is used and what will break if you revoke it.

**To manage API keys for multiple clients, decide who owns each provider account, separate access by client and environment, store credentials in a controlled location and record every workflow that depends on them. Use the same onboarding, rotation and offboarding process for each client.**

That structure also gives you a foundation for tracking usage and setting client budgets. Here is how to build it without turning every new client into a custom administration project.

## 1. Decide who owns the provider accounts

Account ownership should be an onboarding decision. It determines who pays, who can grant access and what must happen when the engagement ends.

There are three workable arrangements:

| Arrangement | How it works | Good fit | Main operational consequence |
|---|---|---|---|
| Client-owned accounts | The client owns and funds provider accounts; the agency receives appropriate access | Clients that need direct billing and control | Client participation is needed for setup and some account changes |
| Agency-owned accounts | The agency funds providers and separates client work within its setup | A centrally managed automation service | The agency must manage attribution, budgets and eventual handover |
| Mixed ownership | Some services belong to the client; others are agency-managed | Workflows combining client business systems with agency-funded AI | Ownership and billing must be recorded per service |

Mixed ownership can be perfectly reasonable. A client might own its CRM and email accounts while your agency pays for the AI calls used to process their data.

The difficulty starts when nobody has written down that distinction.

For each service, record the account owner, payer, administrator and intended handover arrangement. Do not assume an account or its resources can simply be transferred later; check the provider’s supported options when planning the setup.

If ownership depends on how you intend to charge for consumption, use the decision table in [how to bill clients for AI API usage](/guides/bill-clients-for-ai-api-usage).

## 2. Separate access by client, workflow and environment

A useful organising structure is:

**Client → Project or workflow → Environment → Provider credential**

For a fictional agency client, Acme, the inventory could look like this:

| Client | Workflow | Environment | Service | Credential reference |
|---|---|---|---|---|
| Acme | Support assistant | Production | OpenAI | `acme-support-prod-openai` |
| Acme | Support assistant | Development | OpenAI | `acme-support-dev-openai` |
| Acme | Document processing | Production | Anthropic | `acme-documents-prod-anthropic` |
| Acme | Lead research | Production | Search API | `acme-research-prod-search` |
| Beacon | Support assistant | Production | OpenAI | `beacon-support-prod-openai` |

These are inventory labels, not secret key values.

Separating Acme from Beacon lets you replace or revoke one client’s credential without deliberately changing the other client’s integration. Separating development from production keeps experimental access and usage distinct from live delivery.

You do not need a new credential for every node in an automation. Choose boundaries that support independent permissions, reporting, budgets or rotation. Two workflows with the same access needs may share a credential within a client, but document that dependency before doing so.

### Use provider projects and workspaces where appropriate

OpenAI projects provide a way to organise resources and access. Project-scoped service accounts can support workloads without relying on a team member’s personal key. Confirm the available permissions and settings in the [OpenAI project documentation](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform).

Anthropic workspaces also provide an organisational boundary for API usage and access. Select the intended scope explicitly rather than assuming every credential is limited to the client workspace. See the [Anthropic workspace documentation](https://platform.claude.com/docs/en/manage-claude/workspaces).

A provider project, an n8n project and your internal client folder are different objects. Keep a mapping between them. Giving them similar names makes the mapping easier to read, but names alone do not enforce separation.

If an application selects credentials dynamically, derive the client mapping from an authenticated, authorised context. Do not let an arbitrary client identifier in an incoming request choose another customer’s credentials.

## 3. Keep an inventory of references, not a spreadsheet of secrets

The inventory tells your team what exists and where it is used. Your credential store holds the secret values.

For each active credential, record:

| Field | Example |
|---|---|
| Client | Acme |
| Workflow and environment | Support assistant / production |
| Account owner and payer | Agency / agency |
| Provider account and project reference | Account ID and project ID |
| Credential identifier | Provider key ID or internal reference |
| Secret location | Approved vault path or platform credential ID |
| Permissions | Required runtime access |
| Dependencies | Production workflow, worker and deployment references |
| Responsible person | Named technical owner and backup |
| Lifecycle | Created, last replaced, review date and active/revoked status |

The dependency list is especially valuable. If the same credential appears in a scheduled workflow and a background worker, updating only one leaves a partial migration that may fail hours later.

Prefer stable client IDs behind the labels. A customer changing its trading name should not make historical usage or credential ownership ambiguous.

Assign an owner to every record. A shared document with no responsible person tends to become a history of how the system used to work.

## 4. Match the tool to the job

“API key management” can describe several different tasks. The tools overlap, but they are not interchangeable.

| Layer | Main job | What it does not automatically solve |
|---|---|---|
| Provider account, project or workspace | Grants access to the provider and organises its resources | Reporting across every provider |
| Secret manager | Stores and controls retrieval of credentials | API routing or client billing |
| Automation-platform credential store | Makes credentials available to workflows | Agency-wide account ownership and handover |
| API gateway | Routes supported requests and may apply access or spend controls | Every integration and OAuth connection |
| Usage and billing system | Maps consumption to costs and client charges | Secure storage of all application credentials |

A secret manager is useful when several applications need controlled access to the same secrets. It does not remove the underlying provider accounts or decide which client should pay for their usage.

A gateway can replace direct provider credentials in supported integrations with a gateway credential. It also becomes part of the request path, so check compatibility, failure behaviour and which traffic actually passes through it.

Keep privileged administrative credentials separate from normal runtime credentials. An automation that sends model requests should not receive broader account-management access merely because that credential is convenient to copy.

For general guidance on storage, access control and credential lifecycle, see the [OWASP secrets management guidance](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).

## 5. Set up client credentials in n8n deliberately

For n8n client API credentials, use the platform’s credential mechanism instead of inserting keys into prompts, code strings or ordinary node fields.

Where your deployment supports projects, group the client’s workflows and relevant credentials together. Give credentials descriptive names, then review who can use or edit the workflows connected to them.

n8n documents [credential sharing](https://docs.n8n.io/administer/manage-credentials/share-credentials-securely) and [workflow sharing](https://docs.n8n.io/workflows/sharing/). Review both: the ability to work with a credential can matter even when its secret value is not displayed.

n8n also supports [external secret stores](https://docs.n8n.io/administer/manage-credentials/use-external-secret-stores). Its current documentation lists this feature for Enterprise deployments and distinguishes global vaults from project-scoped vaults. Verify availability and scope in your version before designing around it.

A practical setup sequence is:

1. Confirm the client and environment the workflow belongs to.
2. Create or select the corresponding credential record.
3. Connect it to the relevant nodes.
4. Run a small test and confirm which provider scope records the usage.
5. Record the workflow as a dependency in your inventory.
6. Review access before enabling the production schedule.

When cloning an automation for a new client, review every credential reference before running it. Copying the workflow does not prove that its provider access, destination systems or reporting identity now belong to the new client.

## 6. Keep OAuth onboarding separate

An API key is not a replacement for a client authorising access to its own email, CRM or other business account.

For an OAuth integration, record the connected account, authorised scopes, owner and revocation process. A token can stop working because the user withdraws consent or account access changes, even when the AI provider credentials remain valid.

Likewise, rotating an AI API key does not disconnect a CRM integration.

Your onboarding inventory should distinguish at least:

- Provider API credentials used to consume AI or data services.
- OAuth connections authorised against client-owned systems.
- Administrative access used by your agency team.

This distinction becomes essential during offboarding: all three may require different actions.

## 7. Use a repeatable onboarding checklist

Before a new client workflow goes live:

- [ ] Record who owns and funds each provider account.
- [ ] Define the client ID, workflow names and environment boundaries.
- [ ] Create the required provider scopes or gateway projects.
- [ ] Give runtime credentials only the access the workflow needs.
- [ ] Store secrets in the approved credential store.
- [ ] Register credential references, dependencies and responsible owners.
- [ ] Set up client-authorised connections separately where required.
- [ ] Run a controlled test and confirm client-level usage attribution.
- [ ] Configure the relevant budgets, notifications and failure response.
- [ ] Confirm the handover or shutdown arrangement for the end of the engagement.

Do not treat a successful model response as the entire acceptance test. Also check where its cost appeared and whether the workflow used the intended client account.

Production API secrets belong in controlled server-side execution, not browser code or public repositories. OpenAI’s [API key safety guidance](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety) explains the risks of exposing credentials and the importance of restricted access.

## 8. Rotate credentials with their dependencies in view

For a planned replacement, use your inventory to prepare the change:

1. Identify every workflow and deployment using the existing credential.
2. Create a replacement with the intended scope and permissions.
3. Update the approved credential store and any required runtime configuration.
4. Test the consumers, including scheduled or infrequently used jobs.
5. Revoke the old credential once the replacement is working.
6. Confirm the old credential no longer works and update the inventory.

This sequence assumes the provider allows a transition period with both credentials active. If it does not, schedule the change around that limitation. Updating a secret store also does not guarantee every running process has reloaded the value.

Suspected compromise requires a different priority: contain the exposure promptly, even if that interrupts service. Review affected usage and access, replace the credential, and fix how it was exposed. Deleting a leaked string from a file does not revoke the credential.

Set review and rotation practices based on your policies, exposure and provider capabilities. Avoid promising clients a universal rotation schedule that your operating process does not support.

## 9. Offboard the client without affecting other clients

Start by deciding whether the workflows will stop or continue under a new operator. A handover and a shutdown have different sequences.

Use this checklist:

- [ ] Identify all client workflows, schedules, webhooks and background jobs.
- [ ] Confirm which services will stop and which require migration.
- [ ] Capture the final usage report and unresolved billing adjustments.
- [ ] For continuing services, test replacement credentials and the new owner’s access before the agreed cutover.
- [ ] Revoke the agency’s access to client-owned accounts after handover.
- [ ] Revoke retired client-specific credentials and authorised connections as appropriate.
- [ ] Remove obsolete secrets from active runtime configuration and credential stores.
- [ ] Confirm unrelated clients continue operating.
- [ ] Archive the dependency record and record completion.

Revoking a key does not automatically delete provider resources, stop every recurring subscription or remove retained application data. Review those items separately according to the agreed handover and retention process.

If several clients share a credential, you cannot selectively revoke that credential for just one of them. Migrate the remaining clients to appropriately separated access before retiring it. This is one reason to establish client boundaries before the agency grows.

## 10. Connect access to usage and budgets

Client-specific credentials and projects can support cost attribution, but verify what the reporting system actually records.

A key may identify a provider project without identifying every workflow inside it. A client using three providers needs three sources combined unless another system already captures the full scope.

For each client, test these questions:

- Can we identify their usage without guessing from the total bill?
- Can we separate live delivery from internal testing?
- Does the budget cover one project, one provider or all included consumption?
- Does reaching the threshold notify someone, refuse requests or do something else?
- Who is responsible for approving additional spend?

Keep permissions and spending controls distinct. A credential can be restricted to the right service and still generate more consumption than you intended.

Use [how to track AI costs per client](/guides/track-ai-costs-per-client) to turn this access structure into a reconciled client cost report.

## Where Keyone fits in the setup

Keyone’s published approach is an agency account and funded wallet, organised into clients and projects. Each client project receives a Keyone key for its supported catalogue, with usage attributed to that structure.

For agencies choosing centrally managed consumption, this can reduce the provider credentials that individual workflows need to hold. Its public site describes project and client budgets, usage reporting and CSV exports for rebilling.

You still need to store the Keyone key securely, decide who can use it and maintain the workflow dependency record. A credential that accesses several supported services deserves an appropriately limited scope.

To evaluate the arrangement, start with one workflow:

1. Check that its providers, models and required API features are supported.
2. Create the client project and configure the intended controls.
3. Update the integration to use the relevant Keyone endpoint and project key.
4. Test normal execution, attribution and the response to refused requests.
5. Confirm the reporting fits your client cost process before expanding.

Keyone’s current published model uses agency-funded consumption. If the client must retain direct provider accounts and billing, assess that requirement before choosing the gateway arrangement.

It also does not replace every secret or connection your workflow uses. Client CRM authorisation, unrelated database credentials and unsupported services still need their own management process.

**Give every client a clear access boundary, an owner and a handover path. [Explore Keyone](https://getkeyone.com/) for managing supported provider access and spend by client project.**
