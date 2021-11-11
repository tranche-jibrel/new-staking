// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LPToken is ERC20 {
    constructor() ERC20("Test Token", "TEST"){}

    function mint(address account, uint amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint amount) external {
        _burn(account, amount);
    }
}