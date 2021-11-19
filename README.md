# Slice Staking

<img src="https://gblobscdn.gitbook.com/spaces%2F-MP969WsfbfQJJFgxp2K%2Favatar-1617981494187.png?alt=media" alt="Tranche Logo" width="100">

## Development

Migrations to old contracts to proposed new ones has just begun, more tests need to be done and defined

### Install Dependencies

```bash
npm i
```

### Compile project

```bash
truffle compile --all
```

### Run test

Ways to test contracts:

All tests (ganache required: npx ganache-cli --deterministic -l 12000000), gas reporter included:

    `truffle test`   

1 test only (ganache required: npx ganache-cli --deterministic -l 12000000), gas reporter included:

    `truffle test ./test/StakingWithLockup.test.js`   

Solidity Coverage (no ganache required):

    `truffle run coverage --network development --file="<filename>"`   

### Test Coverage

Tests on LockupFactory are at 100%, on LockupStaking is at 96.88%.

Tests on LPFactory are at 100%, LPStaking are at 96%.

[(Back to top)](#slice-staking)

## Main contracts - Name, Size and Description

<table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Size (KiB)</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>LPFactory</td>
            <td><code>4.01</code></td>
            <td>Factory for LP staking contracts.</td>
        </tr>
        <tr>
            <td>LPStaking</td>
            <td><code>2.57</code></td>
            <td>Contract for staking LP tokens.</td>
        </tr>
        <tr>
            <td>LockupFactory</td>
            <td><code>5.80</code></td>
            <td>Factory for staking with lockup contracts.</td>
        </tr>
        <tr>
            <td>LockupStaking</td>
            <td><code>4.39</code></td>
            <td>Contract for single staking with lockup</td>
        </tr>
        <tr>
            <td>MigrateMilestones</td>
            <td><code>0.82</code></td>
            <td>Contract to migrate old milestones to new staking LP token contract</td>
        </tr>
        <tr>
            <td>MigrateStaking</td>
            <td><code>1.78</code></td>
            <td>Contract to migrate old staking with lockup to new same type contract</td>
        </tr>
    </tbody>
  </table>

[(Back to top)](#slice-staking)
