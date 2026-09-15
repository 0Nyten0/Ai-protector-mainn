export function score(input) {
    var var0;
    if (input[1] <= 5.5) {
        var0 = [1.0, 0.0];
    } else {
        var0 = [0.0, 1.0];
    }
    var var1;
    if (input[6] <= 0.07500000111758709) {
        var1 = [1.0, 0.0];
    } else {
        var1 = [0.0, 1.0];
    }
    var var2;
    if (input[2] <= 1.5) {
        var2 = [1.0, 0.0];
    } else {
        var2 = [0.0, 1.0];
    }
    var var3;
    if (input[1] <= 5.5) {
        var3 = [1.0, 0.0];
    } else {
        var3 = [0.0, 1.0];
    }
    var var4;
    if (input[1] <= 5.5) {
        var4 = [1.0, 0.0];
    } else {
        var4 = [0.0, 1.0];
    }
    var var5;
    if (input[5] <= 2999.56494140625) {
        var5 = [0.0, 1.0];
    } else {
        if (input[1] <= 5.5) {
            var5 = [1.0, 0.0];
        } else {
            var5 = [0.0, 1.0];
        }
    }
    var var6;
    if (input[2] <= 1.5) {
        var6 = [1.0, 0.0];
    } else {
        var6 = [0.0, 1.0];
    }
    var var7;
    if (input[6] <= 0.07500000111758709) {
        var7 = [1.0, 0.0];
    } else {
        var7 = [0.0, 1.0];
    }
    var var8;
    if (input[2] <= 1.5) {
        var8 = [1.0, 0.0];
    } else {
        var8 = [0.0, 1.0];
    }
    var var9;
    if (input[1] <= 5.5) {
        var9 = [1.0, 0.0];
    } else {
        var9 = [0.0, 1.0];
    }
    var var10;
    if (input[6] <= 0.07500000111758709) {
        var10 = [1.0, 0.0];
    } else {
        var10 = [0.0, 1.0];
    }
    var var11;
    if (input[4] <= 89372.2265625) {
        var11 = [0.0, 1.0];
    } else {
        var11 = [1.0, 0.0];
    }
    var var12;
    if (input[2] <= 1.5) {
        var12 = [1.0, 0.0];
    } else {
        var12 = [0.0, 1.0];
    }
    var var13;
    if (input[6] <= 0.07500000111758709) {
        var13 = [1.0, 0.0];
    } else {
        var13 = [0.0, 1.0];
    }
    var var14;
    if (input[1] <= 5.5) {
        var14 = [1.0, 0.0];
    } else {
        var14 = [0.0, 1.0];
    }
    return mulVectorNumber(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(addVectors(var0, var1), var2), var3), var4), var5), var6), var7), var8), var9), var10), var11), var12), var13), var14), 0.06666666666666667);
}
function addVectors(v1, v2) {
    var result = new Array(v1.length);
    for (var i = 0; i < v1.length; i++) {
        result[i] = v1[i] + v2[i];
    }
    return result;
}
function mulVectorNumber(v1, num) {
    var result = new Array(v1.length);
    for (var i = 0; i < v1.length; i++) {
        result[i] = v1[i] * num;
    }
    return result;
}
