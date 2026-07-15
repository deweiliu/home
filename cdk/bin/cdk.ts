#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { LaundrySiteStack } from '../lib/laundry-site-stack';

const app = new App();
new LaundrySiteStack(app, 'LaundrySite', {
  tags: { service: 'laundry-site' },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
