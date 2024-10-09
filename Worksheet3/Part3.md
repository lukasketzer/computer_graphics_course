# Part 3 Answer

## Transformation Matricies Part 1
I did not do any translations in the first part. The original vertecies were already in the desired configurtion. 

To achive the view i currently have, i moved the camera inside the cube and changed the at-point to have a more shifted view on the cube.


## Transformation Matricies Part 2

First of all, I created three different cubes. I did this by taking the original cube from Part 1 as a base.

### Left cube
I creted a translational matrix using the `translate()` function to move the square **-1.5** units on the **x-axis**


$$
X = PVTx_{cube}
$$

### Middle cube
I kept the original cube and did not translate or rotate it since it was already in one-point-view.
$$
X = PVIx_{cube}
$$



### Right cube
I creted a translational matrix using the `translate()` function to move the square **+1.6** units on the **x-axis**


$$
X = PVTx_{cube}
$$

