"use strict"

var Canvas = (function () {
    function Canvas(canvasHolder, width, height) {
        var canvasId = 'aoc-graph';

        this._canvasSize = {
            'width':width,
            'height': height,
        };

        $(canvasHolder).css('maxWidth', this._canvasSize.width);
        $(canvasHolder).append('<canvas id="' + canvasId + '" width="' + this._canvasSize.width + '" height="' + this._canvasSize.height + '" style="width:100%;"></canvas>');

        this._canvasEle = $('#' + canvasId)[0];
        this._canvas = this._canvasEle.getContext('2d');
        this._canvasPos = this._canvasEle.getBoundingClientRect();
        this._mousePos = {
            'x': 0,
            'y': 0,
        };

        $(this._canvasEle).click(this._click.bind(this));
        $(this._canvasEle).mousemove(this._move.bind(this));
        
        this._clickHook = null;
        this._mouseMoveHook = null;
    }
    
    Canvas.prototype.getMouseX = function() { return this._mousePos.x };
    Canvas.prototype.getMouseY = function() { return this._mousePos.y };
    Canvas.prototype.getWidth = function() { return this._canvasSize.width };
    Canvas.prototype.getHeight = function() { return this._canvasSize.height };
    Canvas.prototype.getContext = function() { return this._canvas; };

    Canvas.prototype._click = function(mouseEvt) {
        this._updateMouseXY(mouseEvt);

        if (typeof(this._clickHook) === 'function') {
            this._clickHook();
        }
    };

    Canvas.prototype._move = function(mouseEvt) {
        this._updateMouseXY(mouseEvt);

        if (typeof(this._mouseMoveHook) === 'function') {
            this._mouseMoveHook();
        }
    };
    
    Canvas.prototype.click = function(clickHook) {
        this._clickHook = clickHook;
    };

    Canvas.prototype.mousemove = function(mouseMoveHook) {
        this._mouseMoveHook = mouseMoveHook;
    };

    Canvas.prototype.clear = function() {
        this._canvas.clearRect(0, 0, this._canvasSize.width, this._canvasSize.height);
    };
    
    Canvas.prototype.drawLine = function(fromX, fromY, toX, toY, params) {
        var color = '#000'; 
        var alpha = 1;
        var lineWidth = 1;
        
        if (params != undefined) {
            if (params.color != undefined) {
                color = params.color;
            }
            if (params.alpha != undefined) {
                alpha = params.alpha;
            }
            if (params.width != undefined) {
                lineWidth = params.width;
            }   
        }   
        
        this._canvas.shadowBlur = 0;
        this._canvas.globalAlpha = alpha;
        this._canvas.strokeStyle = color;
        this._canvas.lineWidth = lineWidth;
        this._canvas.beginPath();
        this._canvas.moveTo(fromX, fromY);
        this._canvas.lineTo(toX, toY);
        this._canvas.stroke();
    }
    
    Canvas.prototype.drawCircle = function(x, y, params) {
        var size = 6;
        var color = '#000';
        var alpha = 1;

        if (params != undefined) {
            if (params.size != undefined) {
                size = params.size;
            }
            if (params.color != undefined) {
                color = params.color;
            }
            if (params.alpha != undefined) {
                alpha = params.alpha;
            }
        }
        
        this._canvas.shadowColor = '#666';
        this._canvas.shadowBlur = 15;
        this._canvas.shadowOffsetX = 0;
        this._canvas.shadowOffsetY = 0;

        this._canvas.globalAlpha = alpha;
        this._canvas.fillStyle = color;
        this._canvas.beginPath();
        this._canvas.arc(x, y, size, 0, 2 * Math.PI);
        this._canvas.fill();
    };
    
    Canvas.prototype.drawRectangle = function(pointA, pointB, pointC, pointD, params) {
        var fill = '#000';
        var alpha = 1;
        
        if (params != undefined) {
            if (params.fill != undefined) {
                fill = params.fill;
            }
            if (params.alpha != undefined) {
                alpha = params.alpha;
            }
        }
        
        this._canvas.shadowBlur = 0;

        this._canvas.globalAlpha = alpha;
        this._canvas.fillStyle = fill;
        this._canvas.fillRect(pointA, pointB, pointC, pointD);
    }

    Canvas.prototype._updateMouseXY = function(mouseEvt) {
        this._canvasPos = this._canvasEle.getBoundingClientRect();
        var mouseX = mouseEvt.clientX - this._canvasPos.left;
        var mouseY = mouseEvt.clientY - this._canvasPos.top;
        var widthScaled = $(this._canvasEle).width() / this._canvasSize.width;
        var heightScaled = $(this._canvasEle).height() / this._canvasSize.height;
        var x = Math.floor(mouseX / widthScaled);
        var y = Math.floor(mouseY / heightScaled);

        this._mousePos.x = x;
        this._mousePos.y = y;
    };

    return Canvas;
})();

var ACArtist = (function() {
    function ACArtist(ac, canvas) {
        this._ac = ac;
        this._canvas = canvas;

        this._canvas.click(this._click.bind(this));
        
        this._draw();
        
        this._animationIterator = null;
        this._animationSteps = 10;
        
        this._iterationHook = null;
        
        // Keep scope
        for (var i in this) {
            if (typeof this[i] === 'function') {
              this[i] = this[i].bind(this);   
            }
        }
    }

    ACArtist.prototype._click = function() {
        var cities = this._ac.getGraph().getCities();
        for (var cityIndex in cities) {
            var difference = 0;
            difference += Math.abs(cities[cityIndex].getX() - this._canvas.getMouseX());
            difference += Math.abs(cities[cityIndex].getY() - this._canvas.getMouseY());

            if (difference < 30) {
                return;
            }
        }
    
        this._ac.getGraph().addCity(this._canvas.getMouseX(), this._canvas.getMouseY());
        this._ac.getGraph().createEdges();
        
        clearInterval(this._animationIterator);
        this._ac.reset();

        this._draw();
    };
    
    ACArtist.prototype._draw = function() {
        this._canvas.clear();
        this._drawBg();
        this._drawEdges();
        this._drawNodes();
        this._drawCurrentBest();
    };
    
    ACArtist.prototype._drawCurrentBest = function() {
        var ant = this._ac.getGlobalBest();
        if (ant == null || ant.getTour() == null) {
            return;
        }

        var tour = ant.getTour();

        for (var tourIndex = 0; tourIndex < tour.size(); tourIndex++) {
            if (tourIndex < tour.size()-1) {
                this._canvas.drawLine(tour.get(tourIndex).getX(), tour.get(tourIndex).getY(), 
                    tour.get(tourIndex+1).getX(), tour.get(tourIndex+1).getY(),
                    { 'alpha': 0.9, 'color': '#0c6', 'width': 3 });
            } else {
                this._canvas.drawLine(tour.get(tourIndex).getX(), tour.get(tourIndex).getY(), 
                    tour.get(0).getX(), tour.get(0).getY(),
                    { 'alpha': 0.9, 'color': '#0c6', 'width': 3 });
            }
        }
    };

    ACArtist.prototype._drawNodes = function() {  
        var nodes = this._ac.getGraph().getCities();
        
        for (var nodeIndex in nodes) {
            this._canvas.drawCircle(nodes[nodeIndex].getX(), nodes[nodeIndex].getY(), { 'alpha': 0.8 });
        }
    };
    
    ACArtist.prototype._drawEdges = function() {
        var edges = this._ac.getGraph().getEdges();

        var totalPheromone = 0;
        for (var edgeIndex in edges) {
            totalPheromone += edges[edgeIndex].getPheromone();
        }
        
        for (var edgeIndex in edges) {
            var alpha = 0.2;
            if (this._ac.currentIteration() > 0) {
                var width = Math.ceil((edges[edgeIndex].getPheromone() / totalPheromone) * (this._ac.getGraph().size()) * 6);
                alpha = (edges[edgeIndex].getPheromone() / totalPheromone) * (this._ac.getGraph().size()) + 0.03;
                if (alpha > 1) {
                    alpha = 1;
                }
            }

            this._canvas.drawLine(edges[edgeIndex].pointA().x, edges[edgeIndex].pointA().y, 
                edges[edgeIndex].pointB().x, edges[edgeIndex].pointB().y,
                { 'alpha': alpha, 'color': '#06f', 'width': width });
        }
    };
    
    ACArtist.prototype._drawBg = function() {
        var grd = this._canvas.getContext().createLinearGradient(0, 0, 0, this._canvas.getHeight());
        grd.addColorStop(0, "#eee");
        grd.addColorStop(0.4, "#fcfcfc");
        grd.addColorStop(1, "#eee");
        
        this._canvas.drawRectangle(0, 0, this._canvas.getWidth(), this._canvas.getHeight(), { 'fill': grd });
    };
    
    ACArtist.prototype.stop = function() {
        clearInterval(this._animationIterator);
        this._ac.reset();
        this._draw();
    };

    ACArtist.prototype.clearGraph = function() {
        this.stop();
        this._ac.getGraph().clear();
        this._draw();
    };

    ACArtist.prototype.runAC = function(iterationHook) {
        if (!this._ac.ready()) {
            return;
        }
    
        if (typeof(iterationHook) == 'function') {
            this._iterationHook = iterationHook;
        }
    
        clearInterval(this._animationIterator);
        this._ac.reset();
        this._step();
    };
    
    ACArtist.prototype._step = function(iterationHook) {    
        if (this._ac.currentIteration() >= this._ac.maxIterations()) {
            this._draw();
            this._ac.resetAnts();
            return;
        }
        
        // Run a few steps at a time so it doesn't take too long
        for (var i=0; i<3; i++) {
            this._ac.step();
        }
        this._animateAnts();
        
        if (typeof(this._iterationHook) == 'function') {
            this._iterationHook();
        }
    };

    ACArtist.prototype._moveAnt = function(ant, tourIndex, animationStep) {
        // Get last move
        var tourSize = ant.getTour().size();
        var fromCity = ant.getTour().get(tourIndex-1);
        var toCity = ant.getTour().get(tourIndex);

        var xOffset = (toCity.getX() - fromCity.getX()) * ((1 / this._animationSteps) * animationStep);
        var yOffset = (toCity.getY() - fromCity.getY()) * ((1 / this._animationSteps) * animationStep);

        var antXPos = fromCity.getX() + xOffset;
        var antYPos = fromCity.getY() + yOffset;
        
        this._drawAnt(antXPos, antYPos);
    };

    ACArtist.prototype._drawAnt = function(x, y) {
        this._canvas.drawRectangle(x-2, y-2, 4, 4, { 'alpha': 0.5 });
    };

    ACArtist.prototype._animateAnts = function() {   
        var animationIndex = 2;
        this._animationIterator = setInterval(function() {
            this._draw();
            var ants = this._ac.getAnts();
            for (var antIndex in ants) {
                this._moveAnt(ants[antIndex], 1, animationIndex);
            }
            animationIndex++;
            if (animationIndex >= this._animationSteps) {
                clearInterval(this._animationIterator);
                this._step();
            }
        }.bind(this), 20);
    };

    return ACArtist;
})();

var Graph = (function () {
    function Graph() {
        this._cities = [];
        this._edges = {};
    }

    Graph.prototype.getEdges = function() { return this._edges; };
    Graph.prototype.getEdgeCount = function() { return Object.keys(this._edges).length };
    
    Graph.prototype.getCity = function(cityIndex) {
        return this._cities[cityIndex];
    };
    
    Graph.prototype.getCities = function() {
        return this._cities;
    };
    
    Graph.prototype.size = function() {
        return this._cities.length;
    };

    Graph.prototype.addCity = function(x, y) {
        this._cities.push(new City(x,y));
    };

    Graph.prototype._addEdge = function(cityA, cityB) {
        this._edges[cityA.toString() + '-' + cityB.toString()] = new Edge(cityA, cityB);
    };
    
    Graph.prototype.getEdge = function(cityA, cityB) {
        if (this._edges[cityA.toString() + '-' + cityB.toString()] != undefined) {
            return this._edges[cityA.toString() + '-' + cityB.toString()];
        }
        if (this._edges[cityB.toString() + '-' + cityA.toString()] != undefined) {
            return this._edges[cityB.toString() + '-' + cityA.toString()];
        }
    };

    Graph.prototype.createEdges = function() {
        this._edges = {};

        for (var cityIndex = 0; cityIndex < this._cities.length; cityIndex++) {
            for (var connectionIndex = cityIndex; connectionIndex < this._cities.length; connectionIndex++) {
                this._addEdge(this._cities[cityIndex], this._cities[connectionIndex]);
            }
        }
    };
    
    Graph.prototype.resetPheromone = function() {
        for (var edgeIndex in this._edges) {
            this._edges[edgeIndex].resetPheromone();
        }
    }
    
    Graph.prototype.clear = function() {
        this._cities = [];
        this._edges = {};
    }

    return Graph;
})();

var City = (function () {
    function City(x, y) {
        this._x = x;
        this._y = y;
    }

    City.prototype.getX = function() { return this._x; };
    City.prototype.getY = function() { return this._y; };

    City.prototype.toString = function() {
        return this._x + ',' + this._y;
    };

    City.prototype.isEqual = function(city) {
        if (this._x == city._x && this._y == city._y) {
            return true;
        }
        return false;
    };

    return City;
})();

var Edge = (function () {
    function Edge(cityA, cityB) {
        this._cityA = cityA;
        this._cityB = cityB;
        this._initPheromone = 1;
        this._pheromone = this._initPheromone;

        // Calculate edge distance
        var deltaXSq = Math.pow((cityA.getX() - cityB.getX()), 2);
        var deltaYSq = Math.pow((cityA.getY() - cityB.getY()), 2);
        this._distance = Math.sqrt(deltaXSq + deltaYSq);
    }

    Edge.prototype.pointA = function() {
        return { 'x': this._cityA.getX(), 'y': this._cityA.getY() };
    }
    
    Edge.prototype.pointB = function() {
        return { 'x': this._cityB.getX(), 'y': this._cityB.getY() };
    }
    
    Edge.prototype.getPheromone = function() { return this._pheromone; };

    Edge.prototype.getDistance = function() { return this._distance; };

    Edge.prototype.contains = function(city) {
        if (this._cityA.getX() == city.getX()) {
            return true;
        }
        if (this._cityB.getX() == city.getX()) {
            return true;
        }
        return false;
    };

    Edge.prototype.setInitialPheromone = function(pheromone) {
        this._initPheromone = pheromone;
    };

    Edge.prototype.setPheromone = function(pheromone) {
        this._pheromone = pheromone;
    };
    
    Edge.prototype.resetPheromone = function() {
        this._pheromone = this._initPheromone;
    };

    return Edge;
})();

var AntColony = (function () {
    function AntColony(params) {
        this._graph = new Graph();
        this._colony = [];

        // Set default params
        this._colonySize = 20;
        this._alpha = 1;
        this._beta = 3;
        this._rho = 0.1;
        this._q = 1;
        this._initPheromone = this._q;
        this._type = 'acs';
        this._elitistWeight = 0;
        this._maxIterations = 250;
        this._minScalingFactor = 0.001;

        this.setParams(params);

        this._iteration = 0;
        this._minPheromone = null;
        this._maxPheromone = null;

        this._iterationBest = null;
        this._globalBest = null;

        this._createAnts();
    }

    AntColony.prototype.getGraph = function() { return this._graph; };
    AntColony.prototype.getAnts = function() { return this._colony; };
    AntColony.prototype.size = function() { return this._colony.length; };
    AntColony.prototype.currentIteration = function() { return this._iteration; };
    AntColony.prototype.maxIterations = function() { return this._maxIterations; };

    AntColony.prototype._createAnts = function() {
        this._colony = [];
        for (var antIndex = 0; antIndex < this._colonySize; antIndex++) {
            this._colony.push(new Ant(this._graph, {
                'alpha': this._alpha,
                'beta': this._beta,
                'q': this._q,
            }));
        }
    };
    
    AntColony.prototype.setParams = function(params) {
        if (params != undefined) {
            if (params.colonySize != undefined) {
                this._colonySize = params.colonySize;
            }
            if (params.alpha != undefined) {
                this._alpha = params.alpha;
            }
            if (params.beta != undefined) {
                this._beta = params.beta;
            }
            if (params.rho != undefined) {
                this._rho = params.rho;
            }
            if (params.iterations != undefined) {
                this._maxIterations = params.iterations;
            }
            if (params.q != undefined) {
                this._q = params.q;
            }
            if (params.initPheromone != undefined) {
                this._initPheromone = params.initPheromone;
            }
            if (params.type != undefined) {
                if (params.type == 'elitist') {
                    if (params.elitistWeight != undefined) {
                        this._elitistWeight = params.elitistWeight;
                        this._type = 'elitist';
                    }
                } else if (params.type == 'maxmin') {
                    this._type = 'maxmin';
                } else {
                    this._type = 'acs';
                }
            }
            if (params.minScalingFactor != undefined) {
                this._minScalingFactor = params.minScalingFactor;
            }
        }
    };

    AntColony.prototype.reset = function() {
        this._iteration = 0;
        this._globalBest = null;
        this.resetAnts();
        this.setInitialPheromone(this._initPheromone);
        this._graph.resetPheromone();
    };

    AntColony.prototype.setInitialPheromone = function () {
        var edges = this._graph.getEdges();
        for (var edgeIndex in edges) {
            edges[edgeIndex].setInitialPheromone(this._initPheromone);
        }
    };

    AntColony.prototype.resetAnts = function() {
        this._createAnts();
        this._iterationBest = null;
    };
    
    AntColony.prototype.ready = function() {
        if (this._graph.size() <= 1) {
            return false;
        }
        return true;
    }

    AntColony.prototype.run = function() {
        if (!this.ready()) {
            return;
        }
    
        this._iteration = 0;
        while (this._iteration < this._maxIterations) {
            this.step();
        }
    };
    
    AntColony.prototype.step = function() {
        if (!this.ready() || this._iteration >= this._maxIterations) {
            return;
        }

        this.resetAnts();

        for (var antIndex in this._colony) {
            this._colony[antIndex].run();
        }

        this.getGlobalBest();
        this.updatePheromone();

        this._iteration++;
    };

    AntColony.prototype.updatePheromone = function() {
        var edges = this._graph.getEdges();
        for (var edgeIndex in edges) {
            var pheromone = edges[edgeIndex].getPheromone();
            edges[edgeIndex].setPheromone(pheromone * (1 - this._rho));
        }

        if (this._type == 'maxmin') {
            if ((this._iteration / this._maxIterations) > 0.75) {
                var best = this.getGlobalBest();
            } else {
                var best = this.getIterationBest();
            }
            
            // Set maxmin
            this._maxPheromone = this._q / best.getTour().distance();
            this._minPheromone = this._maxPheromone * this._minScalingFactor;

            best.addPheromone();
        } else {
            for (var antIndex in this._colony) {
                this._colony[antIndex].addPheromone();
            }
        }

        if (this._type == 'elitist') {
            this.getGlobalBest().addPheromone(this._elitistWeight);
        }

        if (this._type == 'maxmin') {
            for (var edgeIndex in edges) {
                var pheromone = edges[edgeIndex].getPheromone();
                if (pheromone > this._maxPheromone) {
                    edges[edgeIndex].setPheromone(this._maxPheromone);
                } else if (pheromone < this._minPheromone) {
                    edges[edgeIndex].setPheromone(this._minPheromone);
                }
            }
        }
    };
    
    AntColony.prototype.getIterationBest = function() {
        if (this._colony[0].getTour() == null) {
            return null;
        }

        if (this._iterationBest == null) {
            var best = this._colony[0]

            for (var antIndex in this._colony) {
                if (best.getTour().distance() >= this._colony[antIndex].getTour().distance()) {
                    this._iterationBest = this._colony[antIndex];
                }
            }
        }

        return this._iterationBest;
    };

    AntColony.prototype.getGlobalBest = function() {
        var bestAnt = this.getIterationBest();
        if (bestAnt == null && this._globalBest == null) {
            return null;
        }

        if (bestAnt != null) {
            if (this._globalBest == null || this._globalBest.getTour().distance() >= bestAnt.getTour().distance()) {
                this._globalBest = bestAnt;
            }
        }

        return this._globalBest;
    };

    return AntColony;
})();

var Ant = (function () {
    function Ant(graph, params) {
        this._graph = graph;
        
        this._alpha = params.alpha;
        this._beta = params.beta;
        this._q = params.q;
        this._tour = null;
    }

    Ant.prototype.reset = function() {
        this._tour = null;
    };
    
    Ant.prototype.init = function() {
        this._tour = new Tour(this._graph);
        var randCityIndex = Math.floor(Math.random() * this._graph.size());
        this._currentCity = this._graph.getCity(randCityIndex);
        this._tour.addCity(this._currentCity);
    }

    Ant.prototype.getTour = function() {
        return this._tour;
    };

    Ant.prototype.makeNextMove = function() {
        if (this._tour == null) {
            this.init();
        }

        var rouletteWheel = 0.0;
        var cities = this._graph.getCities();

        var cityProbabilities = [];
        for (var cityIndex in cities) {
            if (!this._tour.contains(cities[cityIndex])) {
                var edge = this._graph.getEdge(this._currentCity, cities[cityIndex]);
                if (this._alpha == 1) {
                    var finalPheromoneWeight = edge.getPheromone();
                } else {
                    var finalPheromoneWeight = Math.pow(edge.getPheromone(), this._alpha);
                }
                cityProbabilities[cityIndex] = finalPheromoneWeight * Math.pow(1.0 / edge.getDistance(), this._beta);
                rouletteWheel += cityProbabilities[cityIndex];
            }
        }

        var wheelTarget = rouletteWheel * Math.random();

        var wheelPosition = 0.0;
        for (var cityIndex in cities) {
            if (!this._tour.contains(cities[cityIndex])) {
                wheelPosition += cityProbabilities[cityIndex];
                if (wheelPosition >= wheelTarget) {
                    this._currentCity = cities[cityIndex];
                    this._tour.addCity(cities[cityIndex]);
                    return;
                }
            }
        }
    };

    Ant.prototype.tourFound = function() {
        if (this._tour == null) {
            return false;
        }
        return (this._tour.size() >= this._graph.size());
    };

    Ant.prototype.run = function(callback) {
        this.reset();
        while (!this.tourFound()) {
            this.makeNextMove();
        }
    };

    Ant.prototype.addPheromone = function(weight) {
        if (weight == undefined) {
            weight = 1;
        }

        var extraPheromone = (this._q * weight) / this._tour.distance();
        for (var tourIndex = 0; tourIndex < this._tour.size(); tourIndex++) {
            if (tourIndex >= this._tour.size()-1) {
                var fromCity = this._tour.get(tourIndex);
                var toCity = this._tour.get(0);
                var edge = this._graph.getEdge(fromCity, toCity);
                var pheromone = edge.getPheromone();
                edge.setPheromone(pheromone + extraPheromone);
            } else {
                var fromCity = this._tour.get(tourIndex);
                var toCity = this._tour.get(tourIndex+1);
                var edge = this._graph.getEdge(fromCity, toCity);
                var pheromone = edge.getPheromone();
                edge.setPheromone(pheromone + extraPheromone);
            }
        }
    };

    return Ant;
})();

var Tour = (function () {
    function Tour(graph) {
        this._graph = graph;
        this._tour = [];
        this._distance = null;
    }

    Tour.prototype.size = function() { return this._tour.length; };

    Tour.prototype.contains = function(city) {
        for (var tourIndex in this._tour) {
            if (city.isEqual(this._tour[tourIndex])) {
                return true;
            }
        }

        return false;
    };

    Tour.prototype.addCity = function(city) {
        this._distance = null;
        this._tour.push(city);
    };

    Tour.prototype.get = function(tourIndex) {
        return this._tour[tourIndex];
    };
    
    Tour.prototype.distance = function() {
        if (this._distance == null) {
            var distance = 0.0;

            for (var tourIndex = 0; tourIndex < this._tour.length; tourIndex++) {
                if (tourIndex >= this._tour.length-1) {
                    var edge = this._graph.getEdge(this._tour[tourIndex], this._tour[0]);
                    distance += edge.getDistance();
                } else {
                    var edge = this._graph.getEdge(this._tour[tourIndex], this._tour[tourIndex+1]);
                    distance += edge.getDistance();
                }
            }

            this._distance = distance;
        }

        return this._distance;
    };

    return Tour;
})();

$(document).ready(function(){
    var antCanvas = new Canvas('#aco-canvas', 1000, 440);
    var ac = new AntColony();
    var acArtist = new ACArtist(ac, antCanvas);

    $('#aco-params select').change(function() {
        acArtist.stop();
        setParams();
    });

    $('#aco-mode').change(function() {
        $('#elitist-weight-input').hide();
        $('.maxmin-params').hide();
        if ($(this).val() == 'elitist') {
            $('#elitist-weight-input').show();
        } else if ($(this).val() == 'maxmin') {
            $('.maxmin-params').show();
        }
    });

    function setParams() {
        var params = {
            'type': $('#aco-mode').val(),
            'colonySize': $('#colony-size').val(),
            'alpha': $('#alpha').val(),
            'beta': $('#beta').val(),
            'rho': $('#rho').val(),
            'iterations': $('#max-iterations').val(),
            'elitistWeight': $('#elitist-weight').val(),
            'initPheromone': $('#init-pheromone').val(),
            'q': $('#pheromone-deposit-weight').val(),
            'minScalingFactor': $('#min-scalar').val(),
        };

        ac.setParams(params);
    }

    setParams();

    $('#start-search-btn').click(function() {
        if (!ac.ready()) {
            loadPopup({msg:'Please add at least two destination nodes'});
        }

        $('.aco-info').show();
        $('#iteration-info').html('0/' + ac.maxIterations());
        $('#best-distance').html('-');
        acArtist.runAC(function() {
            $('#iteration-info').html(ac.currentIteration() + '/' + ac.maxIterations());
            $('#best-distance').html((ac.getGlobalBest().getTour().distance()).toFixed(2));
        });
    });
    $('#clear-graph').click(acArtist.clearGraph);
});
