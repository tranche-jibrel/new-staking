const LockupFactory = artifacts.require('LockupFactory');
const Token = artifacts.require('Token');
const LPStaking = artifacts.require('LPStaking');
const StakingWithLockup = artifacts.require('StakingWithLockup');

const { time } = require("@openzeppelin/test-helpers");

contract("StakingWithLockup", accounts => {
    let token, factory, lpStaking, pool1;

    let owner = accounts[0];

    before(async() => {
        token = await Token.deployed();
        factory = await LockupFactory.deployed();
        lpStaking = await LPStaking.deployed();
    })

    it("check token", async () => {
        let balance = await token.balanceOf(owner);

        expect(balance.toString()).to.equal(
            web3.utils.toWei('1000000000000000000000000000'));
    })

    it("check new staking lockup", async () => {
        await factory.newStakingPool(
            30*24*60*60,
            web3.utils.toWei('1000'),
            10
        )

        pool1 = await factory.stakingPools(0);
        expect(pool1).to.not.equal(0x0000000000000000000000000000000000000000);
    })

    describe('staking pool', () => {
        let rewardRate, maxCapacity, initialBalance;
        before(async() => {
            pool1 = await StakingWithLockup.at(pool1);
        })

        it('check params', async () => {
            rewardRate = await pool1.rewardRate();
            expect(rewardRate.toString()).to.equal('10');

            maxCapacity = await pool1.maxCapacity();
            expect(maxCapacity.toString()).to.equal(web3.utils.toWei('1000'))
        })

        it('fund staking pool', async () => {
            let totalReward = rewardRate*maxCapacity/100;
            await token.transfer(pool1.address, web3.utils.toWei(totalReward.toString()), { from : owner });

            expect((await token.balanceOf(pool1.address)).toString())
            .equal(web3.utils.toWei(totalReward.toString()));
        })

        it('stake 100 tokens', async () => {
            initialBalance = await token.balanceOf(owner);
            // approve 100 tokens
            await token.approve(pool1.address, web3.utils.toWei('100'));
            expect((await token.allowance(owner, pool1.address)).toString()).to.equal(web3.utils.toWei('100'));

            await pool1.stake(web3.utils.toWei('100'), {from: owner});

            expect(parseInt(await token.balanceOf(owner)))
            .to.equal(initialBalance - 100*(10**18))
        })

        it('withdraw tokens', async () => {
            await time.increase(time.duration.days(30));

            expect(parseInt(await token.balanceOf(owner)))
            .to.equal(initialBalance - 100*(10**18))

            await pool1.withdraw(1, {from: owner});

            expect(parseInt(await token.balanceOf(owner))).to.equal(parseInt(initialBalance))
        })
    });
    
})