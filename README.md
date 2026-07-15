# [Home Tasks](https://laundry.dliu.com)

A small website for recording recurring home tasks. It currently tracks laundry and guinea pig cleaning independently, including rolling 40-hour targets for both.

The current user-facing rules are documented at [`/rules.html`](https://laundry.dliu.com/rules.html).

## Architecture

The project follows the `home-site` layout:

- `src/` contains the static webpage.
- CloudFront serves the site from a private S3 bucket at `laundry.dliu.com`.
- `POST /api/timestamps` records the server's current time for the selected task through a Lambda Function URL.
- `GET /api/timestamps` returns the selected task's latest 20 timestamps from DynamoDB.
- `DELETE /api/timestamps` deletes a selected task record during its first hour, after browser confirmation.
- DynamoDB atomically rejects attempts made within one hour of the previous record for the same task.
- The DynamoDB table is retained if the CloudFormation stack is deleted.

## Cost model

The stack avoids provisioned servers, NAT gateways, load balancers, API Gateway, and other resources with meaningful fixed monthly fees. Lambda, DynamoDB on-demand, S3, and CloudFront are charged according to requests, storage, execution time, and data transfer. The ACM certificate is free, and the Route 53 hosted zone is imported from the existing dliu.com infrastructure rather than created by this stack.

## Commands

```sh
make install
make test
make synth
make deploy
```
