# [Laundry Record](https://laundry.dliu.com)

A small website for recording when laundry is started. Anyone can press the button; the server stores the time and the page displays the newest records first. The page also reports whether the latest entry is within the rolling 40-hour target.

The current user-facing rules are documented at [`/rules.html`](https://laundry.dliu.com/rules.html).

## Architecture

The project follows the `home-site` layout:

- `src/` contains the static webpage.
- CloudFront serves the site from a private S3 bucket at `laundry.dliu.com`.
- `POST /api/timestamps` records the server's current time through a Lambda Function URL.
- `GET /api/timestamps` returns the latest 20 timestamps from DynamoDB.
- `DELETE /api/timestamps` deletes a selected record during its first hour, after browser confirmation.
- DynamoDB atomically rejects attempts made within one hour of the previous record.
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
