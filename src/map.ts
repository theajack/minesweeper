
/*
 * @Author: chenzhongsheng
 * @Date: 2024-06-06 16:39:28
 * @Description: Coding something
 */
import {random} from './utils';
import {confirm} from 'tacl-ui';

interface IMapOptions {
    width?: number,
    height?: number,
    tileSize?: number,
    minesCount?: number,
    container?: HTMLElement|string,
}

interface IPos {
    x: number;
    y: number;
}

enum GameTileType {
    Hidden,
    Shown,
    Flag,
    Unsure,
}

const TileType = {
    Initial: 2,
    Mine: -1,
    Empty: 0,
};

export class Map {

    options: Required<IMapOptions> & {container: HTMLElement};
    data: number[][] = []; // 原始信息 -1: 雷
    gameData: GameTileType[][] = []; // 游戏地图信息
    minesList: IPos[] = [];

    dpr = window.devicePixelRatio;

    fontSize = 14;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    Size: {
        TileLeft: number,
        TileTop: number,
        TileSize: number,
    };

    private flagCount = 0;

    private isOver: boolean = false;

    constructor (options: IMapOptions = {}) {

        this.initDom();

        this.config(options, false);

        this.initMapData();
        this.renderMap();

        // @ts-ignore
        window.map = this;
    }

    private initDom () {
        this.canvas = document.createElement('canvas');
        this.canvas.style.border = '1px solid #ccc';

        let timer: any;
        let prev = -1;
        this.canvas.addEventListener('mouseup', e => {
            if (this.isOver) return;
            const {button, offsetX, offsetY} = e;
            if (button !== 0 && button !== 2) return;
            clearTimeout(timer);

            let type: GameTileType = button === 0 ? GameTileType.Shown : GameTileType.Flag;
            if (button + prev === 2) {
                type = GameTileType.Unsure;
            }

            const x = Math.floor(offsetX / this.options.tileSize);
            const y = Math.floor(offsetY / this.options.tileSize);

            prev = button;
            timer = setTimeout(() => {
                prev = -1;
                this.onClick(type, x, y);
            }, 50);
        });
        this.canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        });
    }

    config ({
        width = 20,
        height = 20,
        tileSize = 20,
        minesCount = 40,
        container = document.body,
    }: IMapOptions = {}, reset = true) {
        if (minesCount >= width * height) {
            throw new Error('Too many mines');
        }
        this.options = {
            width, height, tileSize, minesCount,
            container: (typeof container === 'string') ? document.querySelector(container)! : container
        };

        this.initSize();

        if (reset) {
            this.reset();
        }
    }

    reset () {
        this.isOver = false;

        this.initMapData();
        this.renderMap();
    }

    private initSize () {
        // 初始化dom
        const {width, height, tileSize, container} = this.options;
        const w = width * tileSize;
        const h = height * tileSize;
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;

        if (this.canvas.parentElement !== container) {
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d')!;
            this.ctx.strokeStyle = '#444';
            this.ctx.fillStyle = '#444';
        }
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${this.fontSize * this.dpr}px Monospace`;

        const data = this.ctx.measureText('0');
        const TileSize = tileSize * this.dpr;
        this.Size = {
            TileLeft: (TileSize - data.width) / 2,
            TileTop: (TileSize - data.actualBoundingBoxDescent) / 2,
            TileSize,
        };

    }

    private onClick (type: GameTileType, x: number, y: number) {
        // console.log(type, x, y);
        const gameType = this.gameData[y][x];
        let newType: GameTileType = gameType;
        switch (gameType) {
            case GameTileType.Hidden:
            case GameTileType.Unsure:
                newType = type;
                break;
            case GameTileType.Flag:
                if (type === GameTileType.Flag) {
                    newType = GameTileType.Hidden;
                    this.updateFlag(false);
                } else if (type === GameTileType.Unsure) {
                    newType = GameTileType.Unsure;
                }
                break;
            case GameTileType.Shown:
                this.showAllAround(x, y);
                break;
            default: break;
        }
        if (newType === gameType) return;
        this.gameData[y][x] = newType;
        
        if (newType === GameTileType.Shown) {
            const dataType = this.data[y][x];

            if (dataType === TileType.Mine) {
                this.gameOver();
            } else if (dataType === TileType.Empty) {
                this.traverseMap({
                    x, y,
                    corner: true,
                    keepGoing: (x, y, type) => {
                        if (type >= 0) {
                            if (this.gameData[y][x] === GameTileType.Flag) {
                                this.updateFlag(false);
                            }
                            this.gameData[y][x] = GameTileType.Shown;
                            if (type === 0) {
                                return true;
                            }
                        }
                        return false;
                    },
                    next: () => {}
                });
            }
        } else if (newType === GameTileType.Flag) {
            this.updateFlag();
        }

        this.renderMap();
    }

    private showAllAround (x: number, y: number) {
        this.traverseTileAround(x, y, (i, j) => {
            if (this.gameData[j][i] === GameTileType.Hidden) {
                this.onClick(GameTileType.Shown, i, j);
            }
        });
    }

    private updateFlag (add = true) {
        add ? this.flagCount ++ : this.flagCount --;
        // console.warn('updateFlag', add, this.flagCount);
        this.checkWin();
    }

    private gameOver () {
        const {width, height} = this.options;
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                if (this.data[j][i] === TileType.Mine)
                    this.gameData[j][i] = GameTileType.Shown;
            }
        }
        this.renderMap();
        confirm({
            title: 'Tips',
            text: 'Game Over!',
            confirmText: 'Try Again',
            cancelText: 'OK',
        }).then(res => {
            if (res === 'confirm') {
                this.reset();
            }
        });
        this.isOver = true;
    }

    private checkWin () {
        if (this.flagCount !== this.options.minesCount) return false;

        for (const {x, y} of this.minesList) {
            if (this.gameData[y][x] !== GameTileType.Flag) {
                return false;
            }
        }

        confirm({
            title: 'Tips',
            text: 'You Win!',
            confirmText: 'Try Again',
            cancelText: 'OK',
        }).then(res => {
            if (res === 'confirm') {
                this.reset();
            }
        });
        const {width, height} = this.options;
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                this.gameData[j][i] = GameTileType.Shown;
            }
        }
        return true;
    }

    private initMapData () {
        const {width, height, minesCount} = this.options;

        this.flagCount = 0;
        this.data = [];
        this.gameData = [];

        for (let i = 0; i < height; i++) {
            this.data.push(new Array(width).fill(TileType.Initial));
            this.gameData.push(new Array(width).fill(GameTileType.Hidden));
        }

        // 初始化雷
        const set = new Set<string>();
        this.minesList = [];
        while (this.minesList.length < minesCount) {
            let id, x, y;
            do {
                x = random(0, width - 1);
                y = random(0, height - 1);
                id = `${x}-${y}`;
            } while (set.has(id));
            set.add(id);
            this.minesList.push({x, y});
            this.data[y][x] = TileType.Mine;
        }

        // 初始化其他位置
        this.traverseMap({
            ...this.minesList[0],
            keepGoing: () => true,
            next: (x, y, type) => {
                if (type !== TileType.Mine) {
                    const mineCount = this.countAroundMines(x, y);
                    this.data[y][x] = mineCount;
                    // console.log('next', x, y, type, mineCount);
                }
            }
        });
    }

    renderMap () {
        const {width, height} = this.options;
        const tile = this.Size.TileSize;
        this.ctx.clearRect(0, 0, width * tile, height * tile);

        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                this.renderTile(i, j);
            }
        }

        this.ctx.beginPath();
        for (let i = 1; i < width; i++) {
            this.ctx.moveTo(i * tile, 0);
            this.ctx.lineTo(i * tile, height * tile);
        }
        for (let i = 1; i < height; i++) {
            this.ctx.moveTo(0, i * tile);
            this.ctx.lineTo(width * tile, i * tile);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private renderTile (x: number, y: number) {
        const {TileLeft, TileTop, TileSize} = this.Size;
        const gameType = this.gameData[y][x];
        const sx = x * TileSize, sy = y * TileSize;

        const renderBg = () => {
            this.ctx.fillStyle = '#ddd';
            this.ctx.fillRect(sx, sy, TileSize, TileSize);
        };

        switch (gameType) {
            case GameTileType.Hidden: {
                renderBg();
            };break;
            case GameTileType.Flag: {
                renderBg();
                const s = TileSize / 8;
                const image = [
                    [2, 7],
                    [2, 1],
                    [7, 3],
                    [2, 5],
                ];
                image.forEach(([x, y], i) => {
                    x = sx + x * s;
                    y = sy + y * s;
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                });
                this.ctx.fillStyle = '#f44';
                this.ctx.stroke();
                this.ctx.fill();
            };break;
            case GameTileType.Unsure: {
                renderBg();
                this.ctx.fillStyle = '#444';
                this.ctx.fillText(`?`, sx + TileLeft, sy + TileTop);
            };break;
            case GameTileType.Shown: {
                const type = this.data[y][x];
                if (type === 0) return;
                if (type === TileType.Mine) {
                // 画雷
                    const radius = TileSize / 4;
                    this.ctx.moveTo(sx + radius * 3, sy + radius * 2);
                    this.ctx.arc(sx + TileSize / 2, sy + TileSize / 2, radius, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#e44';
                    this.ctx.fill();
                } else {
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillText(`${type === - 1 ? 'B' : type}`, sx + TileLeft, sy + TileTop);
                }
            };break;
            default: break;
        }
    }

    // ! 使用递归会造成调用栈溢出 改成迭代
    private traverseMap ({
        x, y, keepGoing, next,
        corner = false,
    }: IPos & {
        keepGoing: (x: number, y: number, type: number)=>boolean,
        next: (x: number, y: number, type: number) => void,
        corner?: boolean,
    }) {

        const list: IPos[] = [{x, y}];
        const set = new Set<string>();

        while (true) {
            const pos = list.shift();
            if (!pos) break;
            const {x, y} = pos;
            if (set.has(`${x}-${y}`) || this.outOfMap(x, y)) continue;

            set.add(`${x}-${y}`);
            const type = this.data[y][x];
            if (!keepGoing(x, y, type)) continue;

            const directions = [
                {x, y: y - 1},
                {x, y: y + 1},
                {x: x - 1, y},
                {x: x + 1, y},
            ];

            if (corner) {
                directions.push(
                    {x: x - 1, y: y - 1},
                    {x: x - 1, y: y + 1},
                    {x: x + 1, y: y - 1},
                    {x: x + 1, y: y + 1},
                );
            }

            list.push(...directions);

            // console.log('traverseMap', x, y, type);
            next(x, y, this.data[y][x]);
        }
    }

    private outOfMap (x: number, y:number) {
        const {width, height} = this.options;
        return (x < 0 || x >= width) || (y < 0 || y >= height);
    }

    private countAroundMines (x: number, y:number): number {
        let sum = 0;
        this.traverseTileAround(x, y, (i, j) => {
            if (this.data[j][i] === TileType.Mine) {
                sum++;
            }
        });
        return sum;
    }

    private traverseTileAround (x: number, y: number, callback: (x:number, y:number)=>void) {
        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (this.outOfMap(i, j)) continue;
                callback(i, j);
            }
        }
    }
}