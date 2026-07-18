// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FamilyTreasury
/// @notice An M-of-N approval treasury for families pooling stablecoin savings.
///         Every contribution and withdrawal is fully on-chain and attributable.
///         No withdrawal can happen without `threshold` member approvals.
contract FamilyTreasury is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────

    enum ProposalType {
        Withdrawal,
        AddMember,
        RemoveMember,
        ChangeThreshold
    }

    struct Member {
        string name;
        bool active;
        uint64 joinedAt;
        uint256 totalContributed;
    }

    struct Proposal {
        ProposalType proposalType;
        address proposer;
        address target;       // withdrawal recipient, or member address for Add/Remove
        uint256 amount;       // withdrawal amount, or new threshold value
        string name;          // display name for AddMember
        string description;   // human-readable reason, shown to the whole family
        uint32 approvalCount;
        uint64 createdAt;
        bool executed;
        bool cancelled;
    }

    struct Contribution {
        address contributor;
        uint256 amount;
        uint64 timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    IERC20 public immutable token; // e.g. USDC
    string public treasuryName;

    uint256 public threshold;
    uint256 public activeMemberCount;

    address[] public memberList; // includes historically-removed addresses; check `.active`
    mapping(address => Member) public members;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    Contribution[] public contributions;

    // ─────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────

    event Contributed(address indexed member, uint256 amount, uint256 newTotal, uint256 treasuryBalance);
    event ProposalCreated(uint256 indexed id, ProposalType indexed proposalType, address indexed proposer, string description);
    event ProposalApproved(uint256 indexed id, address indexed approver, uint32 approvalCount);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);
    event MemberAdded(address indexed member, string name);
    event MemberRemoved(address indexed member);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold);

    // ─────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────

    error NotMember();
    error AlreadyMember();
    error InvalidThreshold();
    error ProposalNotFound();
    error AlreadyApproved();
    error AlreadyExecuted();
    error AlreadyCancelled();
    error NotEnoughApprovals();
    error NotProposer();
    error ZeroAmount();
    error ZeroAddress();
    error InsufficientBalance();

    // ─────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────

    modifier onlyMember() {
        if (!members[msg.sender].active) revert NotMember();
        _;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor(
        address _token,
        string memory _treasuryName,
        address[] memory _initialMembers,
        string[] memory _initialNames,
        uint256 _threshold
    ) {
        if (_token == address(0)) revert ZeroAddress();
        require(_initialMembers.length == _initialNames.length, "length mismatch");
        require(_initialMembers.length > 0, "need >=1 member");
        require(_threshold > 0 && _threshold <= _initialMembers.length, "bad threshold");

        token = IERC20(_token);
        treasuryName = _treasuryName;
        threshold = _threshold;

        for (uint256 i = 0; i < _initialMembers.length; i++) {
            address m = _initialMembers[i];
            if (m == address(0)) revert ZeroAddress();
            if (members[m].active) revert AlreadyMember();
            members[m] = Member({name: _initialNames[i], active: true, joinedAt: uint64(block.timestamp), totalContributed: 0});
            memberList.push(m);
            emit MemberAdded(m, _initialNames[i]);
        }
        activeMemberCount = _initialMembers.length;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Contributions
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Contribute `amount` of the treasury token. Requires prior ERC20 approval.
    function contribute(uint256 amount) external onlyMember nonReentrant {
        if (amount == 0) revert ZeroAmount();

        token.safeTransferFrom(msg.sender, address(this), amount);

        members[msg.sender].totalContributed += amount;
        contributions.push(Contribution({contributor: msg.sender, amount: amount, timestamp: uint64(block.timestamp)}));

        emit Contributed(msg.sender, amount, members[msg.sender].totalContributed, token.balanceOf(address(this)));
    }

    function contributionCount() external view returns (uint256) {
        return contributions.length;
    }

    /// @notice Paginated contribution history, oldest-first index order preserved.
    function getContributions(uint256 offset, uint256 limit) external view returns (Contribution[] memory page) {
        uint256 total = contributions.length;
        if (offset >= total) return new Contribution[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        page = new Contribution[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = contributions[i];
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Proposals: creation
    // ─────────────────────────────────────────────────────────────────────

    function proposeWithdrawal(address to, uint256 amount, string calldata description) external onlyMember returns (uint256 id) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > token.balanceOf(address(this))) revert InsufficientBalance();
        id = _createProposal(ProposalType.Withdrawal, to, amount, "", description);
    }

    function proposeAddMember(address newMember, string calldata name, string calldata description) external onlyMember returns (uint256 id) {
        if (newMember == address(0)) revert ZeroAddress();
        if (members[newMember].active) revert AlreadyMember();
        id = _createProposal(ProposalType.AddMember, newMember, 0, name, description);
    }

    function proposeRemoveMember(address member, string calldata description) external onlyMember returns (uint256 id) {
        if (!members[member].active) revert NotMember();
        require(activeMemberCount > 1, "cannot remove last member");
        id = _createProposal(ProposalType.RemoveMember, member, 0, "", description);
    }

    function proposeChangeThreshold(uint256 newThreshold, string calldata description) external onlyMember returns (uint256 id) {
        if (newThreshold == 0 || newThreshold > activeMemberCount) revert InvalidThreshold();
        id = _createProposal(ProposalType.ChangeThreshold, address(0), newThreshold, "", description);
    }

    function _createProposal(
        ProposalType pType,
        address target,
        uint256 amount,
        string memory name,
        string memory description
    ) internal returns (uint256 id) {
        id = proposalCount++;
        Proposal storage p = _proposals[id];
        p.proposalType = pType;
        p.proposer = msg.sender;
        p.target = target;
        p.amount = amount;
        p.name = name;
        p.description = description;
        p.createdAt = uint64(block.timestamp);

        emit ProposalCreated(id, pType, msg.sender, description);

        // proposer's own approval counts immediately
        _approve(id);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Proposals: approval + execution
    // ─────────────────────────────────────────────────────────────────────

    function approveProposal(uint256 id) external onlyMember {
        _approve(id);
    }

    function _approve(uint256 id) internal {
        Proposal storage p = _proposals[id];
        if (p.proposer == address(0) && id != 0 && p.createdAt == 0) revert ProposalNotFound();
        if (p.executed) revert AlreadyExecuted();
        if (p.cancelled) revert AlreadyCancelled();
        if (hasApproved[id][msg.sender]) revert AlreadyApproved();

        hasApproved[id][msg.sender] = true;
        p.approvalCount += 1;
        emit ProposalApproved(id, msg.sender, p.approvalCount);

        if (p.approvalCount >= threshold) {
            _execute(id);
        }
    }

    /// @notice Manual execute, in case threshold was already met (e.g. threshold lowered after approvals).
    function executeProposal(uint256 id) external onlyMember {
        Proposal storage p = _proposals[id];
        if (p.executed) revert AlreadyExecuted();
        if (p.cancelled) revert AlreadyCancelled();
        if (p.approvalCount < threshold) revert NotEnoughApprovals();
        _execute(id);
    }

    function _execute(uint256 id) internal nonReentrant {
        Proposal storage p = _proposals[id];
        p.executed = true;

        if (p.proposalType == ProposalType.Withdrawal) {
            if (p.amount > token.balanceOf(address(this))) revert InsufficientBalance();
            token.safeTransfer(p.target, p.amount);
        } else if (p.proposalType == ProposalType.AddMember) {
            members[p.target] = Member({name: p.name, active: true, joinedAt: uint64(block.timestamp), totalContributed: 0});
            memberList.push(p.target);
            activeMemberCount += 1;
            emit MemberAdded(p.target, p.name);
        } else if (p.proposalType == ProposalType.RemoveMember) {
            members[p.target].active = false;
            activeMemberCount -= 1;
            if (threshold > activeMemberCount) {
                uint256 old = threshold;
                threshold = activeMemberCount;
                emit ThresholdChanged(old, threshold);
            }
            emit MemberRemoved(p.target);
        } else if (p.proposalType == ProposalType.ChangeThreshold) {
            uint256 old = threshold;
            threshold = p.amount;
            emit ThresholdChanged(old, threshold);
        }

        emit ProposalExecuted(id);
    }

    function cancelProposal(uint256 id) external {
        Proposal storage p = _proposals[id];
        if (p.proposer != msg.sender) revert NotProposer();
        if (p.executed) revert AlreadyExecuted();
        if (p.cancelled) revert AlreadyCancelled();
        p.cancelled = true;
        emit ProposalCancelled(id);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────────────

    function getProposal(uint256 id) external view returns (Proposal memory) {
        return _proposals[id];
    }

    function getMemberList() external view returns (address[] memory) {
        return memberList;
    }

    function treasuryBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
