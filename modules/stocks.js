// import fetchStockData from './fetchStockData';

const stocks = ['AAPL' ,'MSFT' ,'GOOGL' ,'AMZN' ,'PYPL', 'TSLA' ,'JPM' ,'NVDA', 'NFLX', 'DIS'];
const stockList = document.querySelector(".stock-list");
let currentStock = stocks[0];
let stocksChartData = [];

async function fetchStockList() {
    const data = await fetch("https://stocks3.onrender.com/api/stocks/getstockstatsdata").then(response => response.json());
    if(data.stocksStatsData) {
        data.stocksStatsData.forEach((stocks) => {
            if(stocks) {
                for (const stock in stocks) {
                    if(stock !== "_id") {
                        addStockElement(stock, stocks[stock]);
                    }
                    if(stock === currentStock) {
                        loadStockDetail(stocks[stock]);
                    }
                }
            }
        });
    }
}

function addStockElement(stockName, stockData) {
    const div = document.createElement('div');
    div.classList.add('stock-update');

    const stockNameEle = document.createElement('button');
    stockNameEle.textContent = stockName;
    stockNameEle.classList.add('stock-name');

    stockNameEle.addEventListener('click', () => {
        currentStock = stockName;
        loadStockDetail(stockData);
    })

    const stockPriceEle = document.createElement('span');
    stockPriceEle.textContent = `$${stockData.bookValue}`;
    stockPriceEle.classList.add('stock-price');

    const profit = stockData.profit.toFixed(2);
    const stockProfitEle = document.createElement('span');
    stockProfitEle.textContent = `${profit}%`;
    stockProfitEle.classList.add('stock-profit');
    
    if(profit <= 0) {
        stockProfitEle.classList.add('red');
    }
    
    div.appendChild(stockNameEle);
    div.appendChild(stockPriceEle);
    div.appendChild(stockProfitEle);

    stockList.appendChild(div);
}

async function loadStockDetail(stockData) {
    if(stocks.includes(currentStock)) {
        const data = await fetch("https://stocks3.onrender.com/api/stocks/getstocksprofiledata").then(response => response.json());
        if(data.stocksProfileData) {
            data.stocksProfileData.forEach((stocksProfile) => {
                if(stocksProfile) {
                    for (const stock in stocksProfile) {
                        if(stock !== "_id" && stock === currentStock) {
                            loadStockDetailElement(stock, stocksProfile[stock], stockData);
                            return;
                        }
                    }
                }
            });
        }

        const chartData = await fetch("https://stocks3.onrender.com/api/stocks/getstocksdata").then(response => response.json());
        if(chartData.stocksData) {
            chartData.stocksData.forEach((stocksData) => {
                if(stocksChartData) {
                    for(const stock in stocksData) {
                        if(stock !== "_id" && stock === currentStock) {
                            stocksChartData = stocksData[stock];
                            loadChart('5y');
                        }
                    }
                }
            })
        }
    }
}

function loadStockDetailElement(stockName, stockProfileData, stockData) {

    const stockNameEle = document.getElementById('stock-name')
    stockNameEle.textContent = stockName;

    const profit = stockData.profit.toFixed(2);
    const stockProfitEle = document.getElementById('stock-profit')
    stockProfitEle.textContent = `${profit}%`;

    if(profit <= 0) {
        stockProfitEle.classList.add('red');
    }

    const stockPriceEle = document.getElementById('stock-book-value')
    stockPriceEle.textContent = `$${stockData.bookValue}`;

    const summaryEle = document.querySelector('.summary');
    summaryEle.textContent = stockProfileData.summary;
}

function loadChart(range) {
    if(stocksChartData) {
        const chartData = stocksChartData[range].value;
        let labels = stocksChartData[range].timeStamp;
        labels = labels.map((timestamp) => new Date(timestamp * 1000).toLocaleDateString());
        drawChart(chartData, labels, currentStock);
    }
}

function drawChart(data, labels, stockName) {
    const canvas = document.getElementById('stockChart');
    const ctx = canvas.getContext('2d');
    const chartHeight = canvas.height - 40;
    const chartWidth = canvas.width - 60;
    const dataMax = Math.max(...data);
    const dataMin = Math.min(...data);
    const dataRange = dataMax - dataMin;
    const dataStep = dataRange > 0 ? chartHeight / dataRange : 0;
    const stepX = chartWidth / (data.length - 1);

    // Clear the canvas at the beginning
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the chart
    ctx.beginPath();
    ctx.moveTo(0, chartHeight - (data[0] - dataMin) * dataStep);
    for (let i = 1; i < data.length; i++) {
        ctx.lineTo(i * stepX, chartHeight - (data[i] - dataMin) * dataStep);
    }
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw a dotted horizontal line for value 0
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    const zeroY = chartHeight - (0 - dataMin) * dataStep;
    ctx.moveTo(0, zeroY);
    ctx.lineTo(canvas.width, zeroY);
    ctx.strokeStyle = '#ccc';
    ctx.stroke();
    ctx.setLineDash([]); // Reset the line dash

    // Show tooltip and x-axis value on hover
    const tooltip = document.getElementById('tooltip');
    const xAxisLabel = document.getElementById('xAxisLabel');

    canvas.addEventListener('mousemove', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;
        const dataIndex = Math.min(Math.floor(x / stepX), data.length - 1); // Ensure not to go out of bounds
        const stockValue = data[dataIndex].toFixed(2);
        const xAxisValue = labels[dataIndex];

        tooltip.style.display = 'block';
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y - 20}px`;
        tooltip.textContent = `${stockName}: $${stockValue}`;

        xAxisLabel.style.display = 'block';
        xAxisLabel.style.fontSize = '14px';
        xAxisLabel.style.fontWeight = 'bolder';   
        xAxisLabel.style.left = `${x}px`;
        xAxisLabel.textContent = xAxisValue;

        // Clear the canvas except for the vertical line and data point
        ctx.clearRect(0, 0, canvas.width, chartHeight);
        ctx.clearRect(0, chartHeight + 20, canvas.width, canvas.height - chartHeight - 20);

        // Draw the chart
        ctx.beginPath();
        ctx.moveTo(0, chartHeight - (data[0] - dataMin) * dataStep);
        for (let i = 1; i < data.length; i++) {
        ctx.lineTo(i * stepX, chartHeight - (data[i] - dataMin) * dataStep);
        }
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the dotted horizontal line for value 0
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(0, zeroY);
        ctx.lineTo(canvas.width, zeroY);
        ctx.strokeStyle = '#ccc';
        ctx.stroke();
        ctx.setLineDash([]); // Reset the line dash

        // Draw a vertical line at the current x position when hovering over the chart
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, chartHeight);
        ctx.strokeStyle = '#ccc';
        ctx.stroke();

        // Draw the data point as a bolder ball
        ctx.beginPath();
        ctx.arc(x, chartHeight - (data[dataIndex] - dataMin) * dataStep, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#39FF14';
        ctx.fill();
    });

    canvas.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
        xAxisLabel.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawChart(data, labels, stockName);
    });
}

fetchStockList();