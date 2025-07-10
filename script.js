class CandyCrushGame {
    constructor() {
        this.gridSize = 8;
        this.gemTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.moves = 30;
        this.isAnimating = false;
        this.gameEnded = false;
        
        this.initializeGame();
        this.attachEventListeners();
    }
    
    initializeGame() {
        this.createBoard();
        this.fillBoard();
        this.updateUI();
        
        // 确保初始状态没有匹配项
        while (this.findMatches().length > 0) {
            this.fillBoard();
        }
    }
    
    createBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        this.board = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                gameBoard.appendChild(cell);
                this.board[row][col] = null;
            }
        }
    }
    
    fillBoard() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] === null) {
                    let gemType;
                    let attempts = 0;
                    
                    // 避免创建时就形成匹配
                    do {
                        gemType = this.getRandomGem();
                        attempts++;
                    } while (attempts < 10 && this.wouldCreateMatch(row, col, gemType));
                    
                    this.board[row][col] = gemType;
                    this.updateCellVisual(row, col);
                }
            }
        }
    }
    
    getRandomGem() {
        return this.gemTypes[Math.floor(Math.random() * this.gemTypes.length)];
    }
    
    wouldCreateMatch(row, col, gemType) {
        // 检查水平匹配
        let horizontalCount = 1;
        for (let i = col - 1; i >= 0 && this.board[row][i] === gemType; i--) {
            horizontalCount++;
        }
        for (let i = col + 1; i < this.gridSize && this.board[row][i] === gemType; i++) {
            horizontalCount++;
        }
        
        // 检查垂直匹配
        let verticalCount = 1;
        for (let i = row - 1; i >= 0 && this.board[i][col] === gemType; i--) {
            verticalCount++;
        }
        for (let i = row + 1; i < this.gridSize && this.board[i][col] === gemType; i++) {
            verticalCount++;
        }
        
        return horizontalCount >= 3 || verticalCount >= 3;
    }
    
    updateCellVisual(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell && this.board[row][col]) {
            cell.className = `cell gem-${this.board[row][col]}`;
        }
    }
    
    handleCellClick(event) {
        if (this.isAnimating || this.gameEnded) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (this.selectedCell === null) {
            this.selectCell(row, col);
        } else {
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                this.deselectCell();
            } else if (this.areAdjacent(this.selectedCell, {row, col})) {
                this.attemptSwap(this.selectedCell, {row, col});
            } else {
                this.deselectCell();
                this.selectCell(row, col);
            }
        }
    }
    
    selectCell(row, col) {
        this.selectedCell = {row, col};
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
        this.updateHint('点击相邻的方块来交换位置');
    }
    
    deselectCell() {
        if (this.selectedCell) {
            const cell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
            cell.classList.remove('selected');
            this.selectedCell = null;
            this.updateHint('点击方块来选择');
        }
    }
    
    areAdjacent(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    async attemptSwap(cell1, cell2) {
        this.isAnimating = true;
        this.deselectCell();
        
        // 执行交换
        this.swapGems(cell1, cell2);
        
        // 检查是否形成匹配
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.moves--;
            this.updateUI();
            await this.processMatches();
            this.checkGameEnd();
        } else {
            // 没有匹配，撤销交换
            this.swapGems(cell1, cell2);
            this.updateHint('这次交换没有形成匹配！');
        }
        
        this.isAnimating = false;
    }
    
    swapGems(cell1, cell2) {
        const temp = this.board[cell1.row][cell1.col];
        this.board[cell1.row][cell1.col] = this.board[cell2.row][cell2.col];
        this.board[cell2.row][cell2.col] = temp;
        
        this.updateCellVisual(cell1.row, cell1.col);
        this.updateCellVisual(cell2.row, cell2.col);
    }
    
    findMatches() {
        const matches = [];
        
        // 检查水平匹配
        for (let row = 0; row < this.gridSize; row++) {
            let currentMatch = [];
            let currentGem = null;
            
            for (let col = 0; col < this.gridSize; col++) {
                const gem = this.board[row][col];
                
                if (gem === currentGem && gem !== null) {
                    currentMatch.push({row, col});
                } else {
                    if (currentMatch.length >= 3) {
                        matches.push(...currentMatch);
                    }
                    currentMatch = [{row, col}];
                    currentGem = gem;
                }
            }
            
            if (currentMatch.length >= 3) {
                matches.push(...currentMatch);
            }
        }
        
        // 检查垂直匹配
        for (let col = 0; col < this.gridSize; col++) {
            let currentMatch = [];
            let currentGem = null;
            
            for (let row = 0; row < this.gridSize; row++) {
                const gem = this.board[row][col];
                
                if (gem === currentGem && gem !== null) {
                    currentMatch.push({row, col});
                } else {
                    if (currentMatch.length >= 3) {
                        matches.push(...currentMatch);
                    }
                    currentMatch = [{row, col}];
                    currentGem = gem;
                }
            }
            
            if (currentMatch.length >= 3) {
                matches.push(...currentMatch);
            }
        }
        
        // 去除重复项
        const uniqueMatches = [];
        for (const match of matches) {
            if (!uniqueMatches.some(m => m.row === match.row && m.col === match.col)) {
                uniqueMatches.push(match);
            }
        }
        
        return uniqueMatches;
    }
    
    async processMatches() {
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // 添加得分
            this.score += matches.length * 10;
            
            // 显示消除动画
            await this.animateRemoval(matches);
            
            // 移除匹配的宝石
            for (const match of matches) {
                this.board[match.row][match.col] = null;
            }
            
            // 应用重力
            await this.applyGravity();
            
            // 填充新宝石
            this.fillBoard();
            
            // 检查是否有新的匹配
            await this.processMatches();
        }
        
        this.updateUI();
    }
    
    async animateRemoval(matches) {
        return new Promise(resolve => {
            for (const match of matches) {
                const cell = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
                cell.classList.add('removing');
                
                // 创建粒子效果
                this.createParticles(cell);
            }
            
            setTimeout(resolve, 500);
        });
    }
    
    createParticles(cell) {
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.background = window.getComputedStyle(cell).background;
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.borderRadius = '50%';
            particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px)`;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    async applyGravity() {
        return new Promise(resolve => {
            let hasChanges = false;
            
            for (let col = 0; col < this.gridSize; col++) {
                for (let row = this.gridSize - 1; row >= 0; row--) {
                    if (this.board[row][col] === null) {
                        // 查找上方的宝石
                        for (let searchRow = row - 1; searchRow >= 0; searchRow--) {
                            if (this.board[searchRow][col] !== null) {
                                this.board[row][col] = this.board[searchRow][col];
                                this.board[searchRow][col] = null;
                                hasChanges = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (hasChanges) {
                // 更新视觉效果
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        this.updateCellVisual(row, col);
                        if (this.board[row][col] !== null) {
                            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                            cell.classList.add('falling');
                            setTimeout(() => cell.classList.remove('falling'), 600);
                        }
                    }
                }
                
                setTimeout(resolve, 600);
            } else {
                resolve();
            }
        });
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }
    
    updateHint(message) {
        document.getElementById('hint').textContent = message;
    }
    
    checkGameEnd() {
        if (this.moves <= 0) {
            this.gameEnded = true;
            this.showGameOverModal();
        } else if (!this.hasPossibleMoves()) {
            this.gameEnded = true;
            this.showGameOverModal('没有可能的移动了！');
        }
    }
    
    hasPossibleMoves() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // 检查水平交换
                if (col < this.gridSize - 1) {
                    this.swapGems({row, col}, {row, col: col + 1});
                    if (this.findMatches().length > 0) {
                        this.swapGems({row, col}, {row, col: col + 1}); // 撤销
                        return true;
                    }
                    this.swapGems({row, col}, {row, col: col + 1}); // 撤销
                }
                
                // 检查垂直交换
                if (row < this.gridSize - 1) {
                    this.swapGems({row, col}, {row: row + 1, col});
                    if (this.findMatches().length > 0) {
                        this.swapGems({row, col}, {row: row + 1, col}); // 撤销
                        return true;
                    }
                    this.swapGems({row, col}, {row: row + 1, col}); // 撤销
                }
            }
        }
        return false;
    }
    
    showGameOverModal(message = '游戏结束') {
        document.getElementById('gameOverTitle').textContent = message;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverModal').style.display = 'flex';
    }
    
    newGame() {
        this.score = 0;
        this.moves = 30;
        this.gameEnded = false;
        this.selectedCell = null;
        this.isAnimating = false;
        
        document.getElementById('gameOverModal').style.display = 'none';
        this.initializeGame();
        this.updateHint('点击方块来选择');
    }
    
    showHint() {
        if (this.isAnimating || this.gameEnded) return;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // 检查水平交换
                if (col < this.gridSize - 1) {
                    this.swapGems({row, col}, {row, col: col + 1});
                    if (this.findMatches().length > 0) {
                        this.swapGems({row, col}, {row, col: col + 1}); // 撤销
                        this.highlightHint(row, col, row, col + 1);
                        return;
                    }
                    this.swapGems({row, col}, {row, col: col + 1}); // 撤销
                }
                
                // 检查垂直交换
                if (row < this.gridSize - 1) {
                    this.swapGems({row, col}, {row: row + 1, col});
                    if (this.findMatches().length > 0) {
                        this.swapGems({row, col}, {row: row + 1, col}); // 撤销
                        this.highlightHint(row, col, row + 1, col);
                        return;
                    }
                    this.swapGems({row, col}, {row: row + 1, col}); // 撤销
                }
            }
        }
        
        this.updateHint('没有找到可能的移动！');
    }
    
    highlightHint(row1, col1, row2, col2) {
        const cell1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const cell2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        cell1.style.boxShadow = '0 0 20px #ffff00';
        cell2.style.boxShadow = '0 0 20px #ffff00';
        
        this.updateHint('尝试交换这两个高亮的方块！');
        
        setTimeout(() => {
            cell1.style.boxShadow = '';
            cell2.style.boxShadow = '';
        }, 3000);
    }
    
    attachEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
    }
}

// 初始化游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new CandyCrushGame();
});