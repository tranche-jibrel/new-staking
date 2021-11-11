const LockupFactory = artifacts.require('LockupFactory');
const Token = artifacts.require('Token');
const LPStaking = artifacts.require('LPStaking');
const StakingWithLockup = artifacts.require('StakingWithLockup');

const { time, expectRevert } = require("@openzeppelin/test-helpers");

contract("StakingWithLockup", accounts => {
    let token, factory, lpStaking;
    let initialBalance, pool1;

    let owner = accounts[0];
    let testUser1 = accounts[1];

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

    describe('lockup', () => {
        let rewardRate, maxCapacity;

        before(async() => {
            pool1 = await factory.stakingPools(0);
            pool1 = await StakingWithLockup.at(pool1);

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

            expect(parseInt(await token.balanceOf(owner))).to.equal(parseInt(initialBalance) + 100*(10**18)*(rewardRate/100))
        })
    });

    describe('staking', async () => {

        before(async () => {
            maxCapacity = await pool1.maxCapacity();
            expect(maxCapacity.toString()).to.equal(web3.utils.toWei('1000'))
            
            // use testUser1 to stake tokens
            await token.transfer(testUser1, web3.utils.toWei('10'), {from: owner});
        })

        it('stake 10 tokens', async () => {
            initialBalance = await token.balanceOf(testUser1);

            // approve 10 tokens
            await token.approve(pool1.address, web3.utils.toWei('10'), {from : testUser1});
            expect((await token.allowance(testUser1, pool1.address)).toString()).to.equal(web3.utils.toWei('10'));

            // stake 1 token * 10
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('1'), {from: testUser1});

            expect((await pool1.stakeCounter(testUser1)).toString()).to.equal('10');

            expect(parseInt(await token.balanceOf(testUser1)))
            .to.equal(initialBalance - 10*(10**18))
        })

        it('should throw error staking > maxCapacity tokens', async () => {

            // approve maxCapacity tokens
            await token.approve(pool1.address, maxCapacity, {from: testUser1});
            expect((await token.allowance(testUser1, pool1.address)).toString()).to.equal(maxCapacity.toString());

            await expectRevert(pool1.stake(maxCapacity, {from: testUser1}), "Total deposits limit reached");
        })
    })

    describe('withdraw', () => {

        before(async () => {
            rewardRate = await pool1.rewardRate();
            expect(rewardRate.toString()).to.equal('10');
        })

        it('should not get reward for premature withdrawal of stake1', async () => {

            initialBalance = await token.balanceOf(testUser1);
            expect(parseInt(initialBalance))
            .to.equal(0);

            await pool1.withdraw(1, {from: testUser1});

            expect(parseInt(await token.balanceOf(testUser1))).to.equal(parseInt(initialBalance)+1*(10**18));
        })


        it('should get 10% reward for withdrawal of stake2 after 31 days', async () => {
            await time.increase(time.duration.days(31));

            initialBalance = await token.balanceOf(testUser1);

            await pool1.withdraw(2, {from: testUser1});

            expect(parseInt(await token.balanceOf(testUser1)))
            .to.equal(parseInt(initialBalance) + 1*(10**18)*(1 + (rewardRate/100)))
        })

        it('should withdrawal all stakes after more 31 days', async () => {
            await time.increase(time.duration.days(31));

            initialBalance = await token.balanceOf(testUser1);

            await pool1.withdraw(3, {from: testUser1});
            await pool1.withdraw(4, {from: testUser1});
            await pool1.withdraw(5, {from: testUser1});
            await pool1.withdraw(6, {from: testUser1});
            await pool1.withdraw(7, {from: testUser1});
            await pool1.withdraw(8, {from: testUser1});
            await pool1.withdraw(9, {from: testUser1});
            await pool1.withdraw(10, {from: testUser1});


            expect(parseInt(await token.balanceOf(testUser1)))
            .to.equal(parseInt(initialBalance) + 8*(10**18)*(1 + (rewardRate/100)))
        })


    });
    
    
})