"use strict";
const box_width = 20;
const radius = 10;
class DrawableNode {
    constructor() {
        this.coord_x = 0;
        this.coord_y = 0;
        this.left_width = 0;
        this.right_width = 0;
    }
    setCoordinates(x, y) {
        this.coord_x = x;
        this.coord_y = y;
    }
    measureTree() {
        this.left_width = 0;
        this.right_width = 0;
        if (this.left) {
            this.left.measureTree();
            this.left_width = this.left.left_width + box_width + this.left.right_width;
        }
        if (this.right) {
            this.right.measureTree();
            this.right_width = this.right.left_width + box_width + this.right.right_width;
        }
    }
    computCoordinates() {
        if (this.left) {
            this.left.setCoordinates(this.coord_x - box_width - this.left.right_width, this.coord_y + box_width);
            this.left.computCoordinates();
        }
        if (this.right) {
            this.right.setCoordinates(this.coord_x + box_width + this.right.left_width, this.coord_y + box_width);
            this.right.computCoordinates();
        }
    }
    getSVGCircles() {
        let innerHTML = `<circle cx="${this.coord_x}" cy="${this.coord_y}" r="${radius}" stroke="black" fill="none" />`;
        if (this.left) {
            innerHTML += this.left.getSVGCircles();
        }
        if (this.right) {
            innerHTML += this.right.getSVGCircles();
        }
        return innerHTML;
    }
    getSVGInnerHTML() {
        let innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">';
        this.measureTree();
        this.setCoordinates(this.left_width + box_width, box_width);
        this.computCoordinates();
        innerHTML += this.getSVGCircles() + "</svg>";
        return innerHTML;
    }
}
class Term extends DrawableNode {
    constructor(type, name, left, right) {
        super();
        this.type = "udf";
        this.type = type;
        this.name = name;
        this.left = left;
        this.right = right;
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
}
function evaluateExpr() {
    let inputbox = document.getElementById("input-text");
    if (inputbox) {
        let inputExpr = inputbox.value;
        if (inputExpr) {
            let root = Term.parseExpression(inputExpr);
            if (root) {
                console.log("binary tree to string: ", root.toString());
                root.setCoordinates(0, 0);
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
