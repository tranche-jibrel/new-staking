// SPDX-License-Identifier: MIT
/**
 * Created on 2020-10-13 10:50
 * @summary: JPT token blacklist
 * @author: Fabio Pacchioni
 */
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Blacklist is Ownable {

    mapping (address => bool) public isBlackListed;

    event AddedBlackList(address _user);
    event RemovedBlackList(address _user);

    function getBlackListStatus(address _maker) external view returns (bool) {
        return isBlackListed[_maker];
    }

    function addBlackList (address _evilUser) public onlyOwner {
        isBlackListed[_evilUser] = true;
        emit AddedBlackList(_evilUser);
    }

    function removeBlackList (address _clearedUser) public onlyOwner {
        isBlackListed[_clearedUser] = false;
        emit RemovedBlackList(_clearedUser);
    }

}