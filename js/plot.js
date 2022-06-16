let state = {
    data: [],
    filteredData: [],
    // boolData: false,
    selectedPokemon: [],
    // boolPokemon: false,
    selectedTypes: [],
    // boolTypes: false,
    selectedXAxis: [],
    // boolXAxis: false,
    selectedYAxis: [],
    // boolYAxis: false,
    sixAble: ['HP', 'DEF', 'Sp.ATK', 'Speed', 'Sp.DEF', 'ATK'],
    sixAbility: ['HP', 'Defense', 'Special Attack', 'Speed', 'Special Defense', 'Attack'],
    lineAxes: ['HP', 'Defense', 'Special Attack', 'Speed', 'Special Defense', 'Attack', 'Total'],
    allTypes: ['GRASS', 'POISON', 'FIRE', 'FLYING', 'DRAGON', 'WATER', 'BUG', 'NORMAL', 'ELECTRIC',
        'GROUND', 'FAIRY', 'FIGHTING', 'PSYCHIC', 'ROCK', 'STEEL', 'ICE', 'GHOST', 'DARK'
    ],
    pokemonName: []
}

let dataset = []

const dimensions = {
    margin: 30
}
const tooltipSize = {
    width: 240,
    height: 280,
    radarRadius: 85,
    radarWidth: 85 * 2,
    radarHeight: 85 * 2
}

window.onload = getVisSize()

function getVisSize() {
    chartWidth = $('.vis-chart').width()
    chartHeight = $('.vis-chart').height()
    getDimensions()

}

function getDimensions() {
    dimensions.width = chartWidth * 0.95
    dimensions.height = chartHeight * 0.95
}

let visChart = d3.select('.vis-chart').append("svg")
    .attr('width', dimensions.width)
    .attr('height', dimensions.height * 0.8)
    // .style('background-color', '#e0ffa3')
    .style("transform", `translate(${(chartWidth - dimensions.width) / 3}px, ${dimensions.margin}px)`)

let bound = visChart.append('g')

let pokemonNum = new Object();
async function hello() {
    state.data = await d3.csv("./data/pokemon.csv")
    addTypes()
    filterSelectData()
    addAxesSelector()
    selectXAxis()
    selectYAxis()
    drawPlot()
    searchPokemon()
}
hello()


const xAccessor = d => parseInt(d[state.selectedXAxis])
const yAccessor = d => parseInt(d[state.selectedYAxis])
/** 雷达图，散点，提示 **/
let radar, plot, tooltip
let xScale, yScale
let xAxisGenerator, yAxisGenerator
let xAxis, yAxis
let xAxisLabel, yAxisLabel
let bounds
let drawRadarLine
/* 更新图 */
function updateData() {
    selectXAxis()
    selectYAxis()
    filterSelectData()
    searchPokemon()
    $(".plots").remove()
    drawPlot()
}

/** 绘制坐标轴 **/
function addAxes() {
    $(".Axes").remove()
}

function updatePlot(selectedXAxis, selectedYAxis, data) {
    $(".legend").remove()
    let dataMapX = data.map(xAccessor)
    let dataMapY = data.map(yAccessor)

    bound = bound.append('g')

    xScale.domain([0, d3.max(dataMapX)]).nice()
    yScale.domain([0, d3.max(dataMapY)]).nice()
    xAxisGenerator = d3.axisBottom().scale(xScale).ticks(20)
    yAxisGenerator = d3.axisLeft().scale(yScale).ticks(20)
    d3.select(".line-x-axis-label")
        .text(selectedXAxis)
    d3.select(".line-y-axis-label")
        .text(selectedYAxis)

    xAxis = bound.append('g')
        .attr("class", "Axes")
        .call(xAxisGenerator)
        .style("transform", `translate(${dimensions.margin * 2}px, ${dimensions.height * 0.7}px)`)
    yAxis = bound.append('g')
        .attr("class", "Axes")

        .call(yAxisGenerator)
        .style("transform", `translate(${dimensions.margin * 3}px, ${0}px)`)


    let legend = bound.selectAll('.legend')
        .data(state.selectedTypes)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => "translate(5," + (i + .6) * 20 + ")")

    legend.append('rect')
        .attr('x', dimensions.width * 0.9 + dimensions.margin)
        .attr("width", 24)
        .attr("height", 12)
        .style("fill", d => colorPokemon(d))
        .style("opacity", .9)

    legend.append('text')
        .attr("x", dimensions.width * 0.9 + dimensions.margin * 2)
        .attr("y", 9)
        .style("font-size", "10px")
        .style("text-anchor", "start")
        .text(d => d)
    // JOIN
    plot = visChart.append('g').attr('class', 'plots').selectAll('circle')
        .data(data) /** 后续改为  state.filteredData**/

    // EXIT
    plot.exit()
        .attr("y", 0)
        .attr("r", 0)
        .remove()

    // UPDATE
    plot.attr("cx", d => xScale(xAccessor(d)) + dimensions.margin * 2)
        .attr('cy', d => yScale(yAccessor(d)))



    // ENTER
    plot.enter().append("circle")
        .attr('id', d => d.Type)
        .attr('class', d => d.Name)
        .attr("cx", d => xScale(xAccessor(d)) + dimensions.margin * 2)
        .attr('cy', d => yScale(yAccessor(d)))
        .attr('r', 5)
        .attr('fill', d => colorPokemon(d))
        .style('opacity', .8)
        .style('z-index', 5)
        .style("cursor", "pointer")
        .on('mouseover', function (d) {
            if (this.clicked === false)
                d3.select(this).attr('r', item => selectThis(d, item, 10, 5))
                .style('opacity', item => selectThis(d, item, .5, .8))
                .style('z-index', item => selectThis(d, item, 10, 5))
            addTooltip(d)
            drawRadar()
            drawLine(d)
        })
        .on('mouseout', function (d) {
            if (this.clicked === false)
                d3.select(this).attr('r', 5).style('opacity', 0.8).style('z-index', 5)
            tooltip.remove()
        })
        .on('click', function (d) {
            if (d.clicked) {
                d3.select(this).attr('r', 5).style('opacity', 0.8).style('z-index', 5)

                removeSelectedPokemon(d.Name, d.Type)
                $("#" + d.Type).remove()
                d.clicked = false;
            } else {
                d.clicked = true;

                d3.select(this).attr('r', item => selectThis(d, item, 19, 5))
                    .style('opacity', item => selectThis(d, item, .4, .8))

                drawSelectedPokemon(d)
            }
        })
}

/**  绘制散点图 **/
function drawPlot() {
    // 比例尺
    addAxes()
    xScale = d3.scaleLinear().range([0 + dimensions.margin, dimensions.width * 0.85])
    yScale = d3.scaleLinear().range([dimensions.height * 0.7, 0 + dimensions.margin])
    xAxisLabel = visChart.append("text")
        .attr("text-anchor", "middle")
        .attr("class", "Axes")
        .attr('fiil', 'black')
        .attr("transform",
            `translate(${dimensions.width / 2}, ${dimensions.margin * 1.5 + dimensions.height * 0.7})`)
        .style('font-size', '15px')
        .classed("line-x-axis-label", true)
    yAxisLabel = visChart.append("text")
        .attr("text-anchor", "middle")
        .attr("class", "Axes")
        .attr('fiil', 'black')
        .attr("transform",
            `translate(${dimensions.margin * 1.5}, ${dimensions.height * 0.7 / 2})rotate(-90)`)
        .style('font-size', '15px')
        .classed("line-y-axis-label", true)

    updatePlot(state.selectedXAxis, state.selectedYAxis, state.filteredData)
}

/** 添加 tooltip **/
function addTooltip(d) {
    tooltip = d3.select("body").append('div')
        .attr("class", "tooltip")
        .style("opacity", 0)
    tooltip.style("opacity", 0.8)
    tooltip.html("<b>#: " + d["#"] + "</b><br/>" +
            "<b>Name: " + d.Name + "</b><br/>" +
            "<b>Type: " + d.Type + "</b><br/>")
        .style("left", function () {
            let leftPos = d3.event.pageX
            if (leftPos + tooltipSize.width + 25 >= window.innerWidth)
                leftPos = leftPos - 270
            else leftPos = leftPos + 10
            return leftPos + "px"
        }.bind(this))
        .style("top", function () {
            let topPos = d3.event.pageY
            if (topPos + tooltipSize.height + 25 >= window.innerHeight)
                topPos = topPos - 290
            else topPos = topPos + 10
            return topPos + "px"
        }.bind(this))

}

/** 绘制雷达图 **/
function drawRadar() {
    radar = d3.select('.tooltip').append('div')
        .attr('class', 'radar-tooltip')
        .append("svg")
        .attr("width", "240px")
        .attr("height", "220px")
    const bounds = radar.append("g")
        .style("transform", `translate(${35}px, ${25}px)`)
    // 比例尺
    const radarScale = state.sixAbility.map(i => (
        d3.scaleLinear()
        /** 后续改为  state.filteredData**/
        .domain([0, d3.extent(state.filteredData, d => +d[i])[1]])
        .range([0, 85])
        .nice()
    ))
    // 画雷达图坐标轴   
    const axis = bounds.append("g")

    const gridCircles = d3.range(4).map((d, i) => (
        axis.append("circle")
        .attr("cx", 85)
        .attr("cy", 85)
        .attr("r", 85 * (i / 3))
        .attr("class", "grid-line")
    ))

    const gridLines = state.sixAbility.map((metric, i) => {
        const angle = i * ((Math.PI * 2) / state.sixAbility.length) - Math.PI * 0.5
        return axis.append("line")
            .attr("x1", 170 / 2)
            .attr("y1", 170 / 2)
            .attr("x2", Math.cos(angle) * 85 + 170 / 2)
            .attr("y2", Math.sin(angle) * 85 + 170 / 2)
            .attr("class", "grid-line")
    })
    // 属性标注
    const radarLabels = state.sixAble.map((metric, i) => {
        const angle = i * ((Math.PI * 2) / state.sixAbility.length) - Math.PI * 0.5
        const x = Math.cos(angle) * (85 * 1.1) + 170 / 2
        const y = Math.sin(angle) * (85 * 1.2) + 170 / 2
        return axis.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("class", "metric-label")
            .style("text-anchor",
                i == 0 || i == state.sixAbility.length / 2 ? "middle" :
                i < state.sixAbility.length / 2 ? "start" : "end")
            .text(metric)
    })
    // 数据绘制
    const line = bounds.append("path")
        .attr("class", "line")

    /** 雷达图的线 **/
    drawLine = (pokemon) => {
        const lineGenerator = d3.lineRadial()
            .angle((metric, i) => i * ((Math.PI * 2) / state.sixAbility.length))
            .radius((metric, i) => radarScale[i](+pokemon[metric] || 0))
            .curve(d3.curveLinearClosed)
        const line = bounds.select(".line")
            .datum(state.sixAbility)
            .attr("d", lineGenerator)
            .style("transform", `translate(${85}px, ${85}px)`)
    }

}

/** pokemon 能力系颜色 **/
let colorPokemon = (data) => {
    function color(type) {
        if (type.length !== 0) {
            if (type === "NORMAL") return "#a8a878"
            else if (type === "FIRE") return "#f08030"
            else if (type === "FIGHTING") return "#c03028"
            else if (type === "WATER") return "#6890f0"
            else if (type === "FLYING") return "#a890f0"
            else if (type === "GRASS") return "#78c850"
            else if (type === "POISON") return "#a040a0"
            else if (type === "ELECTRIC") return "#f8d030"
            else if (type === "GROUND") return "#e0c068"
            else if (type === "PSYCHIC") return "#f85888"
            else if (type === "ROCK") return "#b8a038"
            else if (type === "ICE") return "#98d8d8"
            else if (type === "BUG") return "#a8b820"
            else if (type === "DRAGON") return "#7038f8"
            else if (type === "GHOST") return "#705898"
            else if (type === "DARK") return "#705848"
            else if (type === "STEEL") return "#b8b8d0"
            else if (type === "FAIRY") return "#ee99ac"
        } else {
            return ""
        }
    }
    let typeColor
    if (state.allTypes.indexOf(data) > -1) {
        typeColor = color(data)
        return typeColor
    } else {
        let type = data["Type"]
        typeColor = color(type)
        return typeColor
    }
}

/* 鼠标悬浮时，修改信息 */
let selectThis = (data, item, numNew, numOld) => {
    const code = data["#"]
    const type = data["Type"]
    if (item["#"] === code && item["Type"] === type)
        return numNew;
    else return numOld;
}

/** 初始化对能力系的选择交互 **/
let addTypes = () => {
    state.allTypes.map(d => {
        let addtype = d3.select('.all-type')
            .append('div').attr('class', 'type')
            .attr('id', d)
            .attr('name', d)
            .attr('onclick', "getType(this)")
            .append('button')
            .attr('class', 'btn-type')
            .style("background-color", colorPokemon(d))
            .append('span')
            .text(d)

        let btn = $("#" + d).children('.btn-type')
        btn.addClass('btn-type-active')
        state.selectedTypes.push(d)
    })
}


/** 对已选择的 type 的操作 **/
function getType(obj) {

    let id = $(obj).attr('id')
    let classname = $("#" + id).children("button").attr("class")
    let btn = $("#" + id).children('button')
    if (classname === 'btn-type') {
        btn.addClass('btn-type-active').css("background-color", colorPokemon(id))
        state.selectedTypes.push(id)
        // state.boolTypes = true
    } else {
        const index = state.selectedTypes.indexOf(id)
        state.selectedTypes.splice(index, 1)
        // state.boolTypes = true
        btn.removeClass('btn-type-active')
        btn.css("background-color", getDarkColor(colorPokemon(id), 0.6))
    }
}

function getPokemon(obj) {
    // 能力系名
    let id = $(obj).attr('id')
    // 宝可梦名
    let name = $(obj).attr('name')
    $("#" + id).remove()
    // const index = state.selectedPokemon.findIndex(d => d.Name === name && d.Type === id)
    // state.boolPokemon = true
    removeSelectedPokemon(name, id)
}



/** 设置坐标轴 **/
let selectedXAxis = (item) => state.selectedXAxis = item
let selectedYAxis = (item) => state.selectedYAxis = item
let addSelectedPokemon = (item) => state.selectedPokemon.push(item)
let clearAllSelectedPokemon = () => {
    state.selectedPokemon = []
    $(".pokemon").remove()
    $('.clearAllpokemon').attr("disabled", true);
}
let clearAllSelectedTypes = () => state.selectedTypes = []
let removeSelectedPokemon = (data, type) => {
    const index = state.selectedPokemon.findIndex(d => d.Name === data && d.Type === type)
    state.selectedPokemon.splice(index, 1)
}

/* 根据选择的能力系筛选 数据 */
let filterSelectData = () => {

    let filteredData = []
    state.data.map(data => {
        if (state.selectedTypes.indexOf(data.Type) > -1)
            filteredData.push(data)
    })
    state.filteredData = filteredData
}

/** 添加坐标轴 选择 **/
let addAxesSelector = () => {
    state.lineAxes.map(d => {
        d3.selectAll(".dd-button")
            .append('option')
            .attr('value', d)
            .text(d)
    })
}
/** 选择 X 轴 **/
let selectXAxis = () => {
    let type = $('#x-axis').find("option:selected").text()
    if (type[0] === 'C') {
        type = $('#x-axis option:eq(4)').val();
        $('#x-axis').get(0).selectedIndex = 4
    }
    selectedXAxis(type)
    // state.boolXAxis = true
}
/** 选择 Y 轴 **/
let selectYAxis = () => {
    let type = $('#y-axis').find("option:selected").text()
    if (type[0] === 'C') {
        type = $('#y-axis option:eq(3)').val();
        $('#y-axis').get(0).selectedIndex = 3
    }
    selectedYAxis(type)
    // state.boolYAxis = true
}

/* 选择 pokemon */
let addPokemon = (data) => addSelectedPokemon(data)


// let selected

function drawSelectedPokemon(data) {
    // console.log(data)
    // console.log(state.selectedPokemon.findIndex(d => d.Name === data.Name && d.Type === data.Type))
    if (state.selectedPokemon.findIndex(d => d.Name === data.Name && d.Type === data.Type) <= -1) {
        addPokemon(data)
        // state.boolPokemon = true
        d3.select('.select-pokemon')
            .append('div')
            .attr('id', data.Type)
            .attr('name', data.Name)
            .attr('class', 'pokemon')
            .attr('onclick', 'getPokemon(this)')
            .style('background', colorPokemon(data))
            .text(data.Name)
    }

}

function searchPokemon() {
    state.pokemonName = state.filteredData.map(d => d.Name + ":" + d.Type)
    $("#autocomplete").autocomplete({
        source: state.pokemonName
    });

}

function searchAddPokemon() {
    const char = $("#autocomplete").val()
    const charSpllt = char.split(':')
    const name = charSpllt[0]
    const type = charSpllt[1]
    // console.log(name, type)
    const index = state.filteredData.findIndex(d => d.Name === name && d.Type === type)
    if (index >= 0) {
        // console.log(index, state.filteredData[index])
        drawSelectedPokemon(state.filteredData[index])
        const pk = $("circle[id=" + type + "][class=" + name + "]")
        console.log(pk)
        pk.attr('text', '19').css("opacity", 0.4)
        // $('.clearAllpokemon').attr("disabled", false);
    }
}

function removePokemon() {
    if (state.selectedPokemon.length > 0) {
        clearAllSelectedPokemon()
    }
}


function addAllTypes() {
    if (state.selectedTypes.length < state.allTypes.length) {
        state.allTypes.map(id => {
            if (state.selectedTypes.indexOf(id) < 0) {
                let btn = $("#" + id).children('button')
                btn.addClass('btn-type-active').css("background-color", colorPokemon(id))
                state.selectedTypes.push(id)
            }
        })
    }
}

function removeAllTypes() {
    if (state.selectedTypes.length <= state.allTypes.length) {
        state.allTypes.map(id => {
            if (state.selectedTypes.indexOf(id) > -1) {
                let btn = $("#" + id).children('button')
                const index = state.selectedTypes.indexOf(id)
                state.selectedTypes.splice(index, 1)
                // state.boolTypes = true
                btn.removeClass('btn-type-active')
                btn.css("background-color", getDarkColor(colorPokemon(id), 0.6))

            }
        })
    }
}
