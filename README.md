<!--
 * @Author: tackchen
 * @Date: 2022-08-03 21:24:33
 * @Description: Coding something
-->
## Minesweeper game

[Experience] (https://theajack.github.io/minesweeper/)

### Install and use

```
npm i minesweeper-game
```

```js
import {Map} from 'minesweeper-game';

const map = new Map();
```

Reset Map

```js
map.reset();
```

TS Statement

```ts
interface IMapOptions {
    width?: number; // Map size
    height?: number;
    tileSize?: number; // Tile size
    minesCount?: number;
    container?: HTMLElement | string;
}
declare class Map {
    constructor(options?: IMapOptions);
    config({ width, height, tileSize, minesCount, container, }?: IMapOptions, reset?: boolean): void;
    reset(): void;
}
```