Escrow system API description:

1. Create Escrow Transaction:
   - Endpoint: POST /api/escrow/create
   - Description: This endpoint allows a user to initiate a new escrow transaction by specifying the involved parties, funds, and terms.

2. Get Escrow Details:
   - Endpoint: GET /api/escrow/:id
   - Description: Retrieve the details of a specific escrow transaction using its unique identifier.

3. Update Escrow Status:
   - Endpoint: PUT /api/escrow/:id/update
   - Description: Update the status of an escrow transaction (e.g., from "Initiated" to "Funds Released" or "Refunded").

4. Release Funds:
   - Endpoint: POST /api/escrow/:id/release
   - Description: Initiate the release of funds from escrow to the designated recipient once the agreed-upon conditions are met.

5. Refund Funds:
   - Endpoint: POST /api/escrow/:id/refund
   - Description: If the conditions are not met or an issue arises, initiate the refund of funds back to the sender.

6. Dispute Escrow:
   - Endpoint: POST /api/escrow/:id/dispute
   - Description: If there is a disagreement between the parties, this endpoint can be used to raise a dispute and involve a mediator or arbitrator.

7. Mediation Process:
   - Endpoint: POST /api/escrow/:id/mediate
   - Description: If a dispute arises, this endpoint facilitates the mediation process, allowing a third party to intervene and make a decision.

8. Retrieve User Escrows:
   - Endpoint: GET /api/user/:userId/escrows
   - Description: Get a list of escrow transactions involving a specific user, whether they are the sender, recipient, or mediator.

9. Escrow History:
   - Endpoint: GET /api/escrow/:id/history
   - Description: Retrieve the transaction history and status changes for a particular escrow transaction.

10. Escrow Metrics:
    - Endpoint: GET /api/escrow/metrics
    - Description: Get aggregated metrics about the escrow transactions, such as total amount held in escrow, successful transactions, disputes, etc.

