# Part 3 Answer

## Transformation Matricies Part 1
I did not do any translations in the first part. The original vertecies were already in the desired configurtion. 

To achive the view i currently have, i moved the camera inside the cube and changed the at-point to have a more shifted view on the cube.


## Perspective Projection Part 2
In part 2, our goal was to simulate a **pinhole-camera** with a 45° vertical field of view.
I used the `perspective()` function form the libary to alter the perspectiv on my cubes.

Under the hood, `perspective()` used the following mathematics to generate a perspective projection matrix.

$$
P =
\begin{bmatrix}
\frac{1}{A} \cot \frac{\alpha}{2} & 0 & 0 & 0 \\
0 & \cot \frac{\alpha}{2} & 0 & 0 \\
0 & 0 & \frac{n+f}{n-f} & \frac{2nf}{n-f} \\
0 & 0 & -1 & 0
\end{bmatrix}.
$$
Where $\alpha$ is the **vertical field of view**, which in my case is 45°. $A$ is the aspect ratio of the canvas, which can be computed with $A = canvas\_width / canvas\_height$.
$n$ and $f$ are the values for the **near** and **far** plane respectively.



## Transformation Matricies Part 2

Each affine transformation is computed using a 4x4 matrix.

$$
A =
\begin{bmatrix}
\alpha_{11} & \alpha_{12} & \alpha_{13} & \alpha_{14} \\
\alpha_{21} & \alpha_{22} & \alpha_{23} & \alpha_{24} \\
\alpha_{31} & \alpha_{32} & \alpha_{33} & \alpha_{34} \\
0 & 0 & 0 & 1
\end{bmatrix}.
$$

To compute the affine transformation matrix $A$ for my cubes I need three matrices to multiply together and get $A$.
### Translation
The first matrix we need is the translation matrix that displaced the cube in our space. I used the tranlation matrices to move the two other cubes from part 2 to the left and right of the cube in the middle.

$$
T =
\begin{bmatrix}
1 & 0 & 0 & \alpha_x \\
0 & 1 & 0 & \alpha_y \\
0 & 0 & 1 & \alpha_z \\
0 & 0 & 0 & 1
\end{bmatrix}.
$$
$\alpha_x$, $\alpha_y$ and $\alpha_z$ are the units and direction of where we want to move our cube.



### Scaling
I didn't do it in my implementation since I was fine with the size of the cubes. But if one want to alter the size / scaling of their object, they can use a scaling matrix in their transformation matrix.

$$
S = \begin{bmatrix}
\beta_x & 0 & 0 & 0 \\
0 & \beta_y & 0 & 0 \\
0 & 0 & \beta_z & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}.
$$

$\beta_x$, $\beta_y$, and $\beta_z$ are the scaling factors for the desired axis.

### Rotation
Rotation is special in the sence that we can not use one matrix to handle the rotaion around all axis. We need a special matrix for each axis.

#### Rotation around the x-axis
$$
R_x = 
\begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & \cos\theta & -\sin\theta & 0 \\
0 & \sin\theta & \cos\theta & 0 \\
0 & 0 & 0 & 1
\end{bmatrix},
$$
#### Rotation around the y-axis
$$
R_y = 
\begin{bmatrix}
\cos\theta & 0 & \sin\theta & 0 \\
0 & 1 & 0 & 0 \\
-\sin\theta & 0 & \cos\theta & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}.
$$

#### Rotation around the z-axis
$$
R_z =
\begin{bmatrix}
\cos\theta & -\sin\theta & 0 & 0 \\
\sin\theta & \cos\theta & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}.
$$
Where $\theta$ is the angle of ration.
In my project I rotated the right cube around the x-axis.



## Computation
### Model Matrix
Since we are working with matrices, the order of multiplication in importat.
When computer the **model matrix $M$** using translation, rotation and scaling its importat to multiply them in the right order since a different order can yield different results. For me it was best to apply **scaling** first (if I had scaling), then **rotation** and finally **translation**.
$$
M = T * R * S
$$
In my case $S$ is an identity matrix.


### Final CTM
Just like explained in the slided it is important to first multiply the **model matrix** onto the object. After that, we need to apply the **view matrix** and finally the **projections matrix**.

The **model matrix $M$** is the matrix that placed the object in the scene, regardles of perspective, camera position or anythin else.

The **view matrix $V$** moves the camera to the desired point of view.

The **projection matrix $P$** depends on the position of the camera alterd by the view matrix. The projection matrix sets the perspective and fov for the scene.

$$
x_{clip} = PVT x_{model}
$$