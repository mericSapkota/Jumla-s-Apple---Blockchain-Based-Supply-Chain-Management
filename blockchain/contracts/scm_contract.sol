// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AppleBatch {
    enum BatchStatus {
        HARVESTED,
        CERTIFIED,
        IN_TRANSIT,
        DELIVERED
    }
    enum Role {
        NONE,
        FARMER,
        COOPERATIVE,
        TRANSPORTER,
        CONSUMER
    }

    struct TransitUpdate {
        string location;
        uint256 timestamp;
        address updatedBy;
    }

    struct Batch {
        string batchId;
        address farmer;
        string farmerName;
        string farmLocation;
        string appleVariety;
        uint256 weightKg;
        uint256 harvestDate;
        BatchStatus status;
        address cooperative;
        uint256 certifiedAt;
        address transporter;
        uint256 transitStartedAt;
        string destination;
        uint256 deliveredAt;
        string ipfsHash;
        string aiResult;
        bool exists;
    }

    address public owner;
    mapping(string => Batch) private batches;
    mapping(address => Role) public roles;
    mapping(string => TransitUpdate[]) private transitHistory;
    string[] private allBatchIds;

    event BatchCreated(
        string indexed batchId,
        address indexed farmer,
        string farmerName
    );
    event BatchCertified(
        string indexed batchId,
        address indexed cooperative,
        uint256 certifiedAt
    );
    event TransitUpdated(
        string indexed batchId,
        address indexed transporter,
        string location,
        uint256 timestamp
    );
    event BatchDelivered(
        string indexed batchId,
        address indexed transporter,
        string destination,
        uint256 deliveredAt
    );
    event IPFSHashUpdated(string indexed batchId, string ipfsHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Wrong role");
        _;
    }
    modifier batchExists(string memory _batchId) {
        require(batches[_batchId].exists, "Batch not found");
        _;
    }
    modifier batchInStatus(string memory _batchId, BatchStatus _expected) {
        require(batches[_batchId].status == _expected, "Invalid status");
        _;
    }

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.COOPERATIVE;
    }

    function assignRole(address _user, Role _role) external onlyOwner {
        require(_user != address(0), "Zero address");
        roles[_user] = _role;
    }

    function myRole() external view returns (Role) {
        return roles[msg.sender];
    }

    function createBatch(
        string memory _batchId,
        string memory _farmerName,
        string memory _farmLocation,
        string memory _appleVariety,
        uint256 _weightKg,
        uint256 _harvestDate,
        string memory _ipfsHash,
        string memory _aiResult
    ) external onlyRole(Role.FARMER) {
        require(bytes(_batchId).length > 0, "Batch ID required");
        require(!batches[_batchId].exists, "Batch ID already exists");
        require(_weightKg > 0, "Weight must be > 0");
        require(
            _harvestDate <= block.timestamp,
            "Harvest date cannot be future"
        );

        batches[_batchId] = Batch({
            batchId: _batchId,
            farmer: msg.sender,
            farmerName: _farmerName,
            farmLocation: _farmLocation,
            appleVariety: _appleVariety,
            weightKg: _weightKg,
            harvestDate: _harvestDate,
            status: BatchStatus.HARVESTED,
            cooperative: address(0),
            certifiedAt: 0,
            transporter: address(0),
            transitStartedAt: 0,
            destination: "",
            deliveredAt: 0,
            ipfsHash: _ipfsHash,
            aiResult: _aiResult,
            exists: true
        });

        allBatchIds.push(_batchId);
        emit BatchCreated(_batchId, msg.sender, _farmerName);
    }

    function certifyBatch(
        string memory _batchId
    )
        external
        onlyRole(Role.COOPERATIVE)
        batchExists(_batchId)
        batchInStatus(_batchId, BatchStatus.HARVESTED)
    {
        batches[_batchId].status = BatchStatus.CERTIFIED;
        batches[_batchId].cooperative = msg.sender;
        batches[_batchId].certifiedAt = block.timestamp;
        emit BatchCertified(_batchId, msg.sender, block.timestamp);
    }

    function updateTransit(
        string memory _batchId,
        string memory _location,
        string memory _destination
    ) external onlyRole(Role.TRANSPORTER) batchExists(_batchId) {
        Batch storage b = batches[_batchId];
        require(
            b.status == BatchStatus.CERTIFIED ||
                b.status == BatchStatus.IN_TRANSIT,
            "Must be CERTIFIED or IN_TRANSIT"
        );

        if (b.status == BatchStatus.CERTIFIED) {
            b.status = BatchStatus.IN_TRANSIT;
            b.transporter = msg.sender;
            b.transitStartedAt = block.timestamp;
            b.destination = _destination;
        }

        transitHistory[_batchId].push(
            TransitUpdate({
                location: _location,
                timestamp: block.timestamp,
                updatedBy: msg.sender
            })
        );
        emit TransitUpdated(_batchId, msg.sender, _location, block.timestamp);
    }

    function deliverBatch(
        string memory _batchId
    )
        external
        onlyRole(Role.TRANSPORTER)
        batchExists(_batchId)
        batchInStatus(_batchId, BatchStatus.IN_TRANSIT)
    {
        batches[_batchId].status = BatchStatus.DELIVERED;
        batches[_batchId].deliveredAt = block.timestamp;
        emit BatchDelivered(
            _batchId,
            msg.sender,
            batches[_batchId].destination,
            block.timestamp
        );
    }

    function updateIPFSHash(
        string memory _batchId,
        string memory _ipfsHash
    ) external batchExists(_batchId) {
        require(
            batches[_batchId].farmer == msg.sender || msg.sender == owner,
            "Not authorized"
        );
        batches[_batchId].ipfsHash = _ipfsHash;
        emit IPFSHashUpdated(_batchId, _ipfsHash);
    }

    function getBatch(
        string memory _batchId
    )
        external
        view
        batchExists(_batchId)
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            BatchStatus,
            uint256,
            string memory,
            uint256,
            string memory,
            string memory
        )
    {
        Batch storage b = batches[_batchId];
        return (
            b.batchId,
            b.farmerName,
            b.farmLocation,
            b.appleVariety,
            b.weightKg,
            b.harvestDate,
            b.status,
            b.certifiedAt,
            b.destination,
            b.deliveredAt,
            b.ipfsHash,
            b.aiResult
        );
    }

    function getTransitHistory(
        string memory _batchId
    )
        external
        view
        batchExists(_batchId)
        returns (
            string[] memory locations,
            uint256[] memory timestamps,
            address[] memory updaters
        )
    {
        TransitUpdate[] storage history = transitHistory[_batchId];
        uint256 len = history.length;
        locations = new string[](len);
        timestamps = new uint256[](len);
        updaters = new address[](len);
        for (uint256 i = 0; i < len; i++) {
            locations[i] = history[i].location;
            timestamps[i] = history[i].timestamp;
            updaters[i] = history[i].updatedBy;
        }
    }

    function getBatchStatus(
        string memory _batchId
    ) external view batchExists(_batchId) returns (string memory) {
        BatchStatus s = batches[_batchId].status;
        if (s == BatchStatus.HARVESTED) return "HARVESTED";
        if (s == BatchStatus.CERTIFIED) return "CERTIFIED";
        if (s == BatchStatus.IN_TRANSIT) return "IN_TRANSIT";
        return "DELIVERED";
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return allBatchIds;
    }

    function totalBatches() external view returns (uint256) {
        return allBatchIds.length;
    }

    function batchIdExists(
        string memory _batchId
    ) external view returns (bool) {
        return batches[_batchId].exists;
    }
}
