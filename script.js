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
        this.draggedCell = null;
        this.isDragging = false;
        
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
                cell.draggable = true;
                
                // 添加事件监听器
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                cell.addEventListener('dragstart', (e) => this.handleDragStart(e));
                cell.addEventListener('dragover', (e) => this.handleDragOver(e));
                cell.addEventListener('dragenter', (e) => this.handleDragEnter(e));
                cell.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                cell.addEventListener('drop', (e) => this.handleDrop(e));
                cell.addEventListener('dragend', (e) => this.handleDragEnd(e));
                
                // 添加触摸事件支持
                cell.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
                cell.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
                cell.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: false});
                
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
        if (this.isAnimating || this.gameEnded || this.isDragging) return;
        
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
    
    // 拖拽事件处理
    handleDragStart(event) {
        if (this.isAnimating || this.gameEnded) {
            event.preventDefault();
            return;
        }
        
        this.isDragging = true;
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        this.draggedCell = {row, col};
        
        event.target.classList.add('dragging');
        event.dataTransfer.setData('text/plain', `${row},${col}`);
        event.dataTransfer.effectAllowed = 'move';
        
        this.updateHint('拖拽到相邻的方块来交换位置');
        
        // 取消之前的选择
        this.deselectCell();
    }
    
    handleDragOver(event) {
        if (this.isAnimating || this.gameEnded || !this.isDragging) return;
        
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }
    
    handleDragEnter(event) {
        if (this.isAnimating || this.gameEnded || !this.isDragging) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const dropCell = {row, col};
        
        // 检查是否是有效的拖拽目标
        if (this.draggedCell && 
            !(this.draggedCell.row === row && this.draggedCell.col === col) &&
            this.areAdjacent(this.draggedCell, dropCell)) {
            event.target.classList.add('drag-over');
        } else if (this.draggedCell && 
                   !(this.draggedCell.row === row && this.draggedCell.col === col)) {
            event.target.classList.add('drag-invalid');
        }
    }
    
    handleDragLeave(event) {
        if (this.isAnimating || this.gameEnded) return;
        
        event.target.classList.remove('drag-over', 'drag-invalid');
    }
    
    handleDrop(event) {
        if (this.isAnimating || this.gameEnded || !this.isDragging) return;
        
        event.preventDefault();
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const dropCell = {row, col};
        
        // 清除所有拖拽样式
        this.clearDragStyles();
        
        if (this.draggedCell && 
            !(this.draggedCell.row === row && this.draggedCell.col === col) &&
            this.areAdjacent(this.draggedCell, dropCell)) {
            
            // 执行交换
            this.attemptSwap(this.draggedCell, dropCell);
        } else {
            this.updateHint('只能与相邻的方块交换位置！');
        }
        
        this.draggedCell = null;
        this.isDragging = false;
    }
    
    handleDragEnd(event) {
        if (this.isAnimating || this.gameEnded) return;
        
        event.target.classList.remove('dragging');
        this.clearDragStyles();
        this.draggedCell = null;
        this.isDragging = false;
        
        if (!this.isAnimating) {
            this.updateHint('点击或拖拽方块来交换位置');
        }
    }
    
    clearDragStyles() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('drag-over', 'drag-invalid');
        });
    }
    
    // 触摸事件处理（移动设备支持）
    handleTouchStart(event) {
        if (this.isAnimating || this.gameEnded) {
            event.preventDefault();
            return;
        }
        
        this.touchStartTime = Date.now();
        const touch = event.touches[0];
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        this.touchStartCell = {row, col, element: event.target};
        this.touchStartPos = {x: touch.clientX, y: touch.clientY};
        
        // 添加轻微的视觉反馈
        event.target.style.transform = 'scale(1.05)';
    }
    
    handleTouchMove(event) {
        if (this.isAnimating || this.gameEnded || !this.touchStartCell) return;
        
        event.preventDefault();
        const touch = event.touches[0];
        const currentPos = {x: touch.clientX, y: touch.clientY};
        
        // 计算移动距离
        const deltaX = currentPos.x - this.touchStartPos.x;
        const deltaY = currentPos.y - this.touchStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 如果移动距离超过阈值，开始拖拽模式
        if (distance > 20 && !this.isDragging) {
            this.isDragging = true;
            this.draggedCell = this.touchStartCell;
            this.touchStartCell.element.classList.add('dragging');
            this.updateHint('拖拽到相邻的方块来交换位置');
            this.deselectCell();
        }
        
        if (this.isDragging) {
            // 找到当前触摸点下的元素
            const elementBelow = document.elementFromPoint(currentPos.x, currentPos.y);
            
            if (elementBelow && elementBelow.classList.contains('cell')) {
                // 清除之前的高亮
                this.clearDragStyles();
                
                const row = parseInt(elementBelow.dataset.row);
                const col = parseInt(elementBelow.dataset.col);
                const dropCell = {row, col};
                
                if (this.draggedCell && 
                    !(this.draggedCell.row === row && this.draggedCell.col === col) &&
                    this.areAdjacent(this.draggedCell, dropCell)) {
                    elementBelow.classList.add('drag-over');
                } else if (this.draggedCell && 
                           !(this.draggedCell.row === row && this.draggedCell.col === col)) {
                    elementBelow.classList.add('drag-invalid');
                }
            }
        }
    }
    
    handleTouchEnd(event) {
        if (this.isAnimating || this.gameEnded) return;
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        
        // 重置变换
        if (this.touchStartCell) {
            this.touchStartCell.element.style.transform = '';
        }
        
        if (this.isDragging && this.draggedCell) {
            // 处理拖拽结束
            const touch = event.changedTouches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (elementBelow && elementBelow.classList.contains('cell')) {
                const row = parseInt(elementBelow.dataset.row);
                const col = parseInt(elementBelow.dataset.col);
                const dropCell = {row, col};
                
                if (this.draggedCell && 
                    !(this.draggedCell.row === row && this.draggedCell.col === col) &&
                    this.areAdjacent(this.draggedCell, dropCell)) {
                    
                    this.attemptSwap(this.draggedCell, dropCell);
                } else {
                    this.updateHint('只能与相邻的方块交换位置！');
                }
            }
            
            // 清理拖拽状态
            if (this.draggedCell && this.draggedCell.element) {
                this.draggedCell.element.classList.remove('dragging');
            }
            this.clearDragStyles();
        } else if (touchDuration < 300 && !this.isDragging) {
            // 短触摸，当作点击处理
            this.handleCellClick(event);
        }
        
        // 重置触摸状态
        this.touchStartCell = null;
        this.touchStartPos = null;
        this.touchStartTime = null;
        this.draggedCell = null;
        this.isDragging = false;
        
        if (!this.isAnimating) {
            this.updateHint('点击或拖拽方块来交换位置');
        }
    }
    
    selectCell(row, col) {
        this.selectedCell = {row, col};
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
        this.updateHint('点击相邻的方块来交换位置，或拖拽到相邻方块');
    }
    
    deselectCell() {
        if (this.selectedCell) {
            const cell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
            cell.classList.remove('selected');
            this.selectedCell = null;
            this.updateHint('点击或拖拽方块来交换位置');
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
        
        // 添加交换动画效果
        const cell1Element = document.querySelector(`[data-row="${cell1.row}"][data-col="${cell1.col}"]`);
        const cell2Element = document.querySelector(`[data-row="${cell2.row}"][data-col="${cell2.col}"]`);
        
        cell1Element.classList.add('swap-animation');
        cell2Element.classList.add('swap-animation');
        
        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
        
        // 清除动画样式
        cell1Element.classList.remove('swap-animation');
        cell2Element.classList.remove('swap-animation');
        
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
        this.draggedCell = null;
        this.isDragging = false;
        
        document.getElementById('gameOverModal').style.display = 'none';
        this.initializeGame();
        this.updateHint('点击或拖拽方块来交换位置');
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