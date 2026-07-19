// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FamilyTreasury.sol";

/// @title FamilyTreasuryFactory
/// @notice Lets anyone spin up their own independent FamilyTreasury with their own
///         name, signatories, and approval rule. Also indexes treasuries by member
///         so a wallet can look up "which treasuries am I part of".
contract FamilyTreasuryFactory {
    struct TreasuryInfo {
        address treasury;
        address creator;
        string name;
        uint64 createdAt;
    }

    TreasuryInfo[] public allTreasuries;

    // Indexed at creation time only. If someone is added to a treasury later via a
    // proposal, this index won't know about it automatically — they'd need the
    // treasury's address shared with them directly (or we extend this later with a
    // callback from FamilyTreasury on membership changes).
    mapping(address => address[]) public treasuriesByMember;

    event TreasuryCreated(
        address indexed treasury,
        address indexed creator,
        string name,
        address[] members,
        uint256 threshold
    );

    function createTreasury(
        address token,
        string memory name,
        address[] memory members,
        string[] memory memberNames,
        uint256 threshold
    ) external returns (address treasuryAddr) {
        FamilyTreasury t = new FamilyTreasury(token, name, members, memberNames, threshold);
        treasuryAddr = address(t);

        allTreasuries.push(
            TreasuryInfo({treasury: treasuryAddr, creator: msg.sender, name: name, createdAt: uint64(block.timestamp)})
        );

        for (uint256 i = 0; i < members.length; i++) {
            treasuriesByMember[members[i]].push(treasuryAddr);
        }

        emit TreasuryCreated(treasuryAddr, msg.sender, name, members, threshold);
    }

    function allTreasuriesCount() external view returns (uint256) {
        return allTreasuries.length;
    }

    function getTreasuriesForMember(address member) external view returns (address[] memory) {
        return treasuriesByMember[member];
    }
}
