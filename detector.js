class Detector {

    constructor(canvas, imgw, imgh, border_color, rootX, rootY, ctx, threshold) {
        this.canvas = canvas
        this.imgw = imgw;
        this.imgh = imgh;
        this.visited = {}
        this.queue = []
        this.border = []
        //used as a means to store x,y for border
        this.border_color = border_color
        //used as a means to know when we are looking in the wrong place
        this.rootX = rootX
        this.rootY = rootY
        this.ctx = ctx
        //Must be a value between 0 and 1
        this.threshold = threshold * 100;
    }

    test(ctx) {
        console.log(this.getColor(ctx, this.rootX, this.rootY))
        this.setColor(ctx, this.rootX, this.rootY, [255, 255, 255, 255])
        console.log(this.isVisited(100, 100))
        console.log(this.getColor(ctx, this.rootX, this.rootY))
    }

    getColor(ctx, x, y) {
        const startIdx = 0;
        const imageData = ctx.getImageData(x, y, 1, 1);
        return [imageData.data[startIdx], imageData.data[startIdx + 1], imageData.data[startIdx + 2], imageData.data[startIdx + 3]]
    }

    setColor(ctx, x, y, color) {
        const startIdx = (y * (this.canvas.width * 4) + x * 4);
        const imageData = ctx.getImageData(x, y, canvas.width, canvas.height);
        imageData.data[startIdx] = color[0];
        imageData.data[startIdx + 1] = color[1];
        imageData.data[startIdx + 2] = color[2];
        imageData.data[startIdx + 3] = color[3];
        ctx.putImageData(imageData, this.rootX, this.rootY, this.imgw, this.imgh);
    }

    canGo(ctx, x, y, explore) {
        if (this.visited[x] == undefined) {
            this.visited[x] = {};
        }
        return x >= this.rootX && x <= this.rootX + this.imgw
            && y >= this.rootY && y <= this.rootY + this.imgh
            && !this.visited[x][y]
            && (this.isCloseEnoughToBorderColor(this.getColor(ctx, x, y), this.threshold)
                || explore);
    }

    setVisited(x, y) {
        if (this.visited[x] == undefined) {
            this.visited[x] = {};
        }
        this.visited[x][y] = true;
        return true;
    }

    setUnVisited(x, y) {
        if (this.visited[x] == undefined) {
            this.visited[x] = {};
        }
        this.visited[x][y] = false;
        return false;
    }

    isVisited(x, y) {
        let result = this.visited[x][y];
        return result == undefined ? this.setUnVisited(x, y) : result;
    }

    clear_visited() {
        this.visited = {}
    }

    color_border_animate() {
        console.log("Finding border");
        let border = this.find_border(this.ctx);
        console.log("Coloring");
        let i = 0;
        let coloringInterval = setInterval(() => {
            if (i == border.length - 1) {
                clearInterval(this);
            }
            let color = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 255]//[0,0,0,0]//this.getDepthHexColor(i, border.length - 1)//[0, 255, 0, 255];
            let point = border[i];
            const imageData = this.ctx.getImageData(point.x, point.y, 1, 1);
            const startIdx = 0;// (point.y * (this.canvas.width * 4) + point.x * 4);
            imageData.data[startIdx] = color[0];
            imageData.data[startIdx + 1] = color[1];
            imageData.data[startIdx + 2] = color[2];
            imageData.data[startIdx + 3] = color[3];
            ctx.putImageData(imageData, point.x, point.y);
            i++;
        }, 0);
        console.log("Done coloring");
    }

    color_border() {
        console.log("Finding border");
        let border = this.find_border(this.ctx);
        console.log("Coloring");
        for (var i = 0; i < border.length; i++) {
            let color = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 255]//[0,0,0,0]//this.getDepthHexColor(i, border.length - 1)//[0, 255, 0, 255];
            let point = border[i];
            const imageData = this.ctx.getImageData(point.x, point.y, 1, 1);
            const startIdx = 0;// (point.y * (this.canvas.width * 4) + point.x * 4);
            imageData.data[startIdx] = color[0];
            imageData.data[startIdx + 1] = color[1];
            imageData.data[startIdx + 2] = color[2];
            imageData.data[startIdx + 3] = color[3];
            ctx.putImageData(imageData, point.x, point.y);
        }
        console.log("Done coloring");
    }

    find_root(ctx) {
        const stack = []
        //up down left right and the 4 diagonals
        const directions = [[1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 1], [0, -1]]

        let root = {x: (this.rootX + this.imgw) / 2, y: (this.rootY + this.imgh) / 2};
        stack.push(root);

        while (stack.length > 0) {
            let { x, y } = stack.shift();
            x = Math.round(x);
            y = Math.round(y);
            if (this.visited[x] == undefined) {
                this.visited[x] = {};
            }
            if (this.visited[x][y]) {
                continue;
            }
            this.setVisited(x, y)
            if (this.isCloseEnoughToBorderColor(this.getColor(ctx, x, y), this.threshold)) {
                this.clear_visited();
                return ({ x: x, y: y });
            } else {
                console.log(this.rgbaArrToHex(this.getColor(ctx, x, y)).toLowerCase());
            }
            directions.forEach(dir => {
                let deltaX = Number(x) + Number(dir[0]);
                let deltaY = Number(y) + Number(dir[1]);
                // console.log(this.canGo(ctx, deltaX, deltaY, false));
                if (this.canGo(ctx, deltaX, deltaY, true)) {
                    if (!this.visited[deltaX][deltaY]) {
                        stack.push({ x: deltaX, y: deltaY })
                    }
                }
            })
        }
        console.log("Couldn't find root.")
        return null;
    }

    find_border(ctx) {
        const result = []
        const stack = []
        //up down left right and the 4 diagonals
        const directions = [[1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 1], [0, -1]]

        // let root = {x: this.canvas.width / 2, y: this.canvas.height / 2};
        let root = {x: this.rootX, y: this.rootY};
        // let root = this.find_root(ctx);
        stack.push(root);

        while (stack.length > 0) {
            let { x, y } = stack.shift();
            x = Math.round(x);
            y = Math.round(y);
            if (this.visited[x] == undefined) {
                this.visited[x] = {};
            }
            if (this.visited[x][y]) {
                continue;
            }
            this.setVisited(x, y)
            if (this.isCloseEnoughToBorderColor(this.getColor(ctx, x, y), this.threshold)) {
                result.push({ x: x, y: y });
            } else {
                console.log(this.rgbaArrToHex(this.getColor(ctx, x, y)).toLowerCase());
            }
            directions.forEach(dir => {
                let deltaX = Number(x) + Number(dir[0]);
                let deltaY = Number(y) + Number(dir[1]);
                // console.log(this.canGo(ctx, deltaX, deltaY, false));
                if (this.canGo(ctx, deltaX, deltaY, true)) {
                    if (!this.visited[deltaX][deltaY]) {
                        stack.push({ x: deltaX, y: deltaY })
                    }
                }
            })
        }

        return result
    }

    isCloseEnoughToBorderColor(color, threshold) {
        const border_arr = this.hexToRgbaArr(this.border_color);
        const deltaRed = (Math.abs(border_arr[0] - color[0]) / 255) * 100;
        const deltaGreen = (Math.abs(border_arr[1] - color[1]) / 255) * 100;
        const deltaBlue = (Math.abs(border_arr[2] - color[2]) / 255) * 100;
        const deltaAlpha = (Math.abs(border_arr[3] - color[3]) / 255) * 100;
        const average = (deltaRed + deltaGreen + deltaBlue + deltaAlpha) / 4;
        return average <= threshold;
    }

    rgbaArrToHex(color) {
        const loneAppender = "0";

        let red = color[0].toString(16);
        let green = color[1].toString(16);
        let blue = color[2].toString(16);
        let alpha = color[3].toString(16);

        return "0x" + (red.length == 1 ? + loneAppender + red : red)
            + (green.length == 1 ? + loneAppender + green : green)
            + (blue.length == 1 ? + loneAppender + blue : blue)
        + (alpha.length == 1 ? + loneAppender + alpha : alpha);
    }


    hexToRgbaArr(color) {
        if (color.charAt(0) == '#') {
            //# trim
            color = color.substring(1);
        } else {
            //0x trim
            color = color.substring(2);
        }
        let red = color.substring(0, 2);
        let green = color.substring(2, 4);
        let blue = color.substring(4, 6);
        let alpha = color.substring(6, 8);

        return [parseInt(red, 16), parseInt(green, 16), parseInt(blue, 16), parseInt(alpha, 16)];
    }

    getDepthHexColor(num, range) {
        return this.hexToRgbaArr("0x" + this.depthToHex(num, range, false) + "ff" + this.depthToHex(num, range, true) + "ff");
    }

    depthToHex(num, range, reverse) {
        const hexList = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
        let colorVal = (num / range) * 256;
        if (reverse) {
            colorVal = 255 - colorVal;
        }
        let red = hexList[Math.floor(colorVal / 16)];
        let green = hexList[Math.round(colorVal % 16)];
        return (red + green);
    }


}

