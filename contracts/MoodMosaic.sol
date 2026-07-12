// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MoodMosaic {
    uint256 public nextTileId = 1;

    struct Tile {
        address maker;
        string mood;
        string colorName;
        string note;
        string shape;
        uint256 createdAt;
    }

    mapping(uint256 => Tile) private tiles;

    event TileStamped(
        uint256 indexed tileId,
        address indexed maker,
        string mood,
        string colorName
    );

    function stampTile(
        string calldata mood,
        string calldata colorName,
        string calldata note,
        string calldata shape
    ) external returns (uint256 tileId) {
        require(bytes(mood).length > 0 && bytes(mood).length <= 32, "Invalid mood");
        require(bytes(colorName).length > 0 && bytes(colorName).length <= 24, "Invalid color");
        require(bytes(note).length > 0 && bytes(note).length <= 120, "Invalid note");
        require(bytes(shape).length > 0 && bytes(shape).length <= 18, "Invalid shape");

        tileId = nextTileId++;
        tiles[tileId] = Tile({
            maker: msg.sender,
            mood: mood,
            colorName: colorName,
            note: note,
            shape: shape,
            createdAt: block.timestamp
        });

        emit TileStamped(tileId, msg.sender, mood, colorName);
    }

    function getTile(
        uint256 tileId
    )
        external
        view
        returns (
            address maker,
            string memory mood,
            string memory colorName,
            string memory note,
            string memory shape,
            uint256 createdAt
        )
    {
        Tile storage entry = tiles[tileId];
        return (
            entry.maker,
            entry.mood,
            entry.colorName,
            entry.note,
            entry.shape,
            entry.createdAt
        );
    }
}
