const LPFactory = artifacts.require('LPFactory');
const LPStaking = artifacts.require('LPStaking');

const Token = artifacts.require('Token');
const LPToken = artifacts.require('LPToken');

const { time, expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { parse } = require("dotenv");

contract("LPStaking", accounts => {
    let token, lp_token, factory, lpStaking;
    let initialBalance, pool1, pool2;

    let owner = accounts[0];
    let testUser1 = accounts[1];
    let testUser2 = accounts[2];
    let testUser3 = accounts[3];

    before(async() => {
        token = await Token.deployed();
        lp_token = await LPToken.new();

        factory = await LPFactory.deployed();
    })

    it("check token", async () => {
        let balance = await token.balanceOf(owner);

        expect(balance.toString()).to.equal(
            web3.utils.toWei('1000000000000000000000000000'));
    })
    
    it('new lp staking pool - 1', async () => {
        await factory.newStakingPool(lp_token.address, 100);
        pool1 = await LPStaking.at(await factory.stakingPools(0));
        expect(pool1.address).to.not.equal(0x0000000000000000000000000000000000000000);

        // fund the staking pool
        await token.transfer(pool1.address, web3.utils.toWei('1000000'));
    })

    describe('rewards with 1 stake', async() => {
        before(async() => {
            await lp_token.mint(testUser1, web3.utils.toWei('100'));
            await lp_token.mint(testUser2, web3.utils.toWei('80'));
            await lp_token.mint(testUser3, web3.utils.toWei('20'));
        })

        it('stake from user1', async () => {

            await lp_token.approve(pool1.address, web3.utils.toWei('100'), {from: testUser1});

            await pool1.stake(web3.utils.toWei('50'), {from: testUser1});
            await pool1.stake(web3.utils.toWei('50'), {from: testUser1});

            expect((await pool1.balanceOf(testUser1)).toString()).to.equal(web3.utils.toWei('100'));

        })

        it('withdraw after 1000 sec', async() => {

            await time.increase(1000);

            await pool1.exit({from: testUser1});

            expect((await pool1.balanceOf(testUser1)).toString()).to.equal(web3.utils.toWei('0'));
            expect(parseInt(await token.balanceOf(testUser1))).to.equal(100*1001);
            expect((await lp_token.balanceOf(testUser1)).toString()).to.equal(web3.utils.toWei('100'));

        })
    })


})