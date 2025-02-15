"use strict";
const box_width = 40;
const radius = 20;
class NodeStorage {
    constructor() {
        this.counter = 0;
        this.storage = new Map();
        this.root = null;
    }
    static getInstance() {
        return this.instance;
    }
    getCouner() {
        this.counter += 1;
        return this.counter;
    }
    resetStorage() {
        this.counter = 0;
        this.storage.clear();
    }
    insertNode(node) {
        this.storage.set(node.nodeid, node);
    }
    getNode(nodeid) {
        var _a;
        return (_a = this.storage.get(nodeid)) !== null && _a !== void 0 ? _a : undefined;
    }
}
NodeStorage.instance = new NodeStorage();
class DrawableNode {
    constructor() {
        this.nodeid = -1;
        this.coord_x = 0;
        this.coord_y = 0;
        this.left_width = 0;
        this.right_width = 0;
        this.height = 0;
    }
    getText() { return "xx"; }
    getColor() { return "white"; }
    isClickable() { return false; }
    setCoordinates(x, y) {
        this.coord_x = x;
        this.coord_y = y;
    }
    measureTree() {
        this.nodeid = NodeStorage.getInstance().getCouner();
        this.left_width = 0;
        this.right_width = 0;
        this.height = box_width;
        let left_height = 0;
        let right_height = 0;
        if (this.left) {
            this.left.measureTree();
            this.left_width = this.left.left_width + box_width + this.left.right_width;
            left_height = this.left.height;
        }
        if (this.right) {
            this.right.measureTree();
            this.right_width = this.right.left_width + box_width + this.right.right_width;
            right_height = this.right.height;
        }
        this.height += left_height > right_height ? left_height : right_height;
    }
    getSVGContents() {
        let innerHTML = "";
        let leftinnerHTML = "";
        let rightinnerHTML = "";
        if (this.left) {
            this.left.setCoordinates(this.coord_x - box_width - this.left.right_width, this.coord_y + box_width);
            innerHTML += `<line x1= "${this.coord_x}" y1 = "${this.coord_y}" x2 = "${this.left.coord_x}" y2 = "${this.left.coord_y}" style="stroke:black;stroke-width:1" />`;
            leftinnerHTML = this.left.getSVGContents();
        }
        if (this.right) {
            this.right.setCoordinates(this.coord_x + box_width + this.right.left_width, this.coord_y + box_width);
            innerHTML += `<line x1= "${this.coord_x}" y1 = "${this.coord_y}" x2 = "${this.right.coord_x}" y2 = "${this.right.coord_y}" style="stroke:black;stroke-width:1" />`;
            rightinnerHTML = this.right.getSVGContents();
        }
        if (this.isClickable()) {
            NodeStorage.getInstance().insertNode(this);
            innerHTML += `<circle cx="${this.coord_x}" cy="${this.coord_y}" r="${radius}" stroke="black" 
            fill="${this.getColor()}" onClick="onClickRedex(${this.nodeid})" />`;
        }
        else {
            innerHTML += `<circle cx="${this.coord_x}" cy="${this.coord_y}" r="${radius}" stroke="black" 
            fill="${this.getColor()}" />`;
        }
        innerHTML += `<text text-anchor="middle" x= "${this.coord_x}" y= "${this.coord_y}">${this.getText()}</text>`;
        innerHTML += leftinnerHTML;
        innerHTML += rightinnerHTML;
        return innerHTML;
    }
    getSVGInnerHTML() {
        NodeStorage.getInstance().resetStorage();
        this.measureTree();
        let innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="${this.height + 20}"  width = ${box_width + this.left_width + this.right_width + 20} version="1.1">`;
        this.setCoordinates(this.left_width + box_width / 2 + 10, box_width / 2 + 10);
        innerHTML += this.getSVGContents() + "</svg>";
        return innerHTML;
    }
}
class Term extends DrawableNode {
    static indexFreeVariable(x) {
    }
    constructor(type, name, left, right) {
        super();
        this.type = "udf";
        this.type = type;
        this.name = name;
        this.left = left;
        this.right = right;
    }
    isRedex() {
        if (this.type === "app" && this.left && this.left.type === "func") {
            return true;
        }
        return false;
    }
    getText() {
        var _a, _b;
        if (this.type === "var") {
            return ` ${(_a = this.name) !== null && _a !== void 0 ? _a : ""}_${(_b = this.index) !== null && _b !== void 0 ? _b : -1} `;
        }
        else {
            return this.type;
        }
    }
    getColor() {
        if (this.isRedex()) {
            return "pink";
        }
        return "white";
    }
    isClickable() {
        if (this.isRedex()) {
            return true;
        }
        return false;
    }
    toString() {
        var _a, _b, _c, _d, _e;
        if (this.type === "var") {
            return (_a = this.name) !== null && _a !== void 0 ? _a : "";
        }
        else if (this.type === "func") {
            return ((_b = this.left) === null || _b === void 0 ? void 0 : _b.toString()) + "=>" + ((_c = this.right) === null || _c === void 0 ? void 0 : _c.toString());
        }
        else if (this.type === "app") {
            return "(" + ((_d = this.left) === null || _d === void 0 ? void 0 : _d.toString()) + ")(" + ((_e = this.right) === null || _e === void 0 ? void 0 : _e.toString()) + ")";
        }
        return "";
    }
    duplicate() {
        let copy = new Term(this.type, this.name, undefined, undefined);
        if (this.left) {
            copy.left = this.left.duplicate();
        }
        if (this.right) {
            copy.right = this.right.duplicate();
        }
        copy.index = -1;
        return copy;
    }
    static parseExpression(input) {
        if (!input) {
            return null;
        }
        let node = null;
        if (input[0] === '(') {
            node = new Term("app");
            let counter = 1;
            for (let i = 1; i < input.length; i++) {
                if (input[i] === '(') {
                    counter += 1;
                }
                else if (input[i] === ')') {
                    counter -= 1;
                }
                if (counter === 0) {
                    node.left = Term.parseExpression(input.substring(1, i));
                    node.right = Term.parseExpression(input.substring(i + 2, input.length - 1));
                    return node;
                }
            }
            return null;
        }
        else {
            for (let i = 1; i < input.length; i++) {
                if (input[i] === '=' && i + 1 < input.length && input[i + 1] === '>') {
                    //function
                    let node = new Term("func");
                    node.left = Term.parseExpression(input.substring(0, i));
                    node.right = Term.parseExpression(input.substring(i + 2));
                    return node;
                }
            }
            return new Term("var", input);
        }
    }
    static alphaConvert(x) {
        Term.indexBoundVariables(x, 0, []);
    }
    static indexBoundVariables(x, counter, stack) {
        if (x.type === "func") {
            counter += 1;
            if (x.left && x.left.type === "var") {
                x.left.index = counter;
                if (x.right) {
                    stack.push(x.left);
                    counter = Term.indexBoundVariables(x.right, counter, stack);
                    stack.pop();
                }
            }
            return counter;
        }
        else if (x.type === "app") {
            if (x.left) {
                counter = Term.indexBoundVariables(x.left, counter, stack);
            }
            if (x.right) {
                counter = Term.indexBoundVariables(x.right, counter, stack);
            }
            return counter;
        }
        else if (x.type === "var") {
            for (let i = stack.length - 1; 0 <= i; i--) {
                if (stack[i].name && stack[i].name === x.name) {
                    x.index = stack[i].index;
                    return counter;
                }
            }
            x.index = 0;
        }
        return counter;
    }
    static betaDFS(x, subs, boundVarId) {
        if (x.type === "var" && x.index === boundVarId) {
            let dup = subs.duplicate();
            if (!dup) {
                console.log("duplication of subs failed");
                return false;
            }
            x.left = dup.left;
            x.right = dup.right;
            x.type = dup.type;
            x.name = dup.name;
            x.index = -1;
            return true;
        }
        else if (x.type === "func" && x.right) {
            Term.betaDFS(x.right, subs, boundVarId);
            return true;
        }
        else if (x.type === "app" && x.left && x.right) {
            Term.betaDFS(x.left, subs, boundVarId);
            Term.betaDFS(x.right, subs, boundVarId);
            return true;
        }
        return false;
    }
    static betaReduce(x) {
        var _a, _b, _c;
        if (!x.isRedex() || !x.left || !x.right || !x.left.left || !x.left.right) {
            return false;
        }
        let boundVarId = (_b = (_a = x.left) === null || _a === void 0 ? void 0 : _a.left) === null || _b === void 0 ? void 0 : _b.index;
        if (boundVarId === undefined) {
            return false;
        }
        Term.betaDFS((_c = x.left) === null || _c === void 0 ? void 0 : _c.right, x.right, boundVarId);
        return true;
    }
}
function evaluateExpr() {
    let inputbox = document.getElementById("input-text");
    if (inputbox) {
        let inputExpr = inputbox.value;
        if (inputExpr) {
            let root = Term.parseExpression(inputExpr);
            if (root) {
                NodeStorage.getInstance().root = root;
                root.setCoordinates(0, 0);
                Term.alphaConvert(root);
                let svgCanvas = document.getElementById("canvas");
                if (svgCanvas) {
                    svgCanvas.innerHTML = root.getSVGInnerHTML();
                }
            }
            else {
                console.log("failed to parse expression");
            }
        }
        else {
            console.log("failed to get input box content");
        }
    }
    else {
        console.log("failed to get inputbox");
    }
}
function onClickRedex(nodeid) {
    let redex = NodeStorage.getInstance().getNode(nodeid);
    if (redex === undefined) {
        console.log("clicked redex is undefined");
        return;
    }
    Term.betaReduce(redex);
    let root = NodeStorage.getInstance().root;
    if (root) {
        Term.alphaConvert(root);
        let svgCanvas = document.getElementById("canvas");
        if (svgCanvas) {
            svgCanvas.innerHTML = root.getSVGInnerHTML();
        }
    }
}
