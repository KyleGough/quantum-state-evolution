# Qubit Evolution

Interactive single-qubit visualiser: tune a Hamiltonian, pick $|\psi(0)\rangle$, and watch Schrödinger evolution on the Bloch sphere.

**[Open Qubit Evolution](https://kylegough.github.io/qubit-evolution/)**

<img width="1544" height="1284" alt="Qubit Evolution: Bloch sphere, Hamiltonian controls, and Dirac notation" src="https://github.com/user-attachments/assets/0db8a982-8401-430d-b661-bac726ecdc14" />

## Hamiltonian

The Hamiltonian, $H$ is the energy operator. For a single qubit it is a $2\times 2$ Hermitian matrix, and formed by a real linear combination of the Pauli matrices:

$$
\sigma_x = \begin{bmatrix} 0 & 1 \cr 1 & 0 \end{bmatrix},\quad
\sigma_y = \begin{bmatrix} 0 & -i \cr i & 0 \end{bmatrix},\quad
\sigma_z = \begin{bmatrix} 1 & 0 \cr 0 & -1 \end{bmatrix}.
$$

Users can fine-tune the Hamiltonian parameters $\omega$, $\Omega_x$, $\Omega_y$ to form the Hamiltonian:

$$
H = \frac{\omega}{2}\sigma_z + \frac{\Omega_x}{2}\sigma_x + \frac{\Omega_y}{2}\sigma_y
$$

The sign of each coefficient sets the sense of rotation about that axis. On the Bloch sphere the state precesses about $\vec{\Omega}$ at

$$
\omega_R = \sqrt{\omega^2 + \Omega_x^2 + \Omega_y^2},\qquad T = 2\pi/\omega_R.
$$
