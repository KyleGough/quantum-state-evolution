# Quantum State Evolution

Interactive single-qubit visualiser: tune a Hamiltonian, pick $|\psi(0)\rangle$, and watch Schrödinger evolution on the Bloch sphere.

**[Open the visualiser](https://kylegough.github.io/quantum-state-evolution/)**

<img width="1630" height="1285" alt="Quantum State Evolution: Bloch sphere, Hamiltonian controls, and Dirac notation" src="https://github.com/user-attachments/assets/7db3832d-299f-45c8-89b0-ec2be358bf7d" />

## Hamiltonian

The Hamiltonian, $H$ is the energy operator. For a single qubit it is a $2\times 2$ Hermitian matrix which has real eigenvalues and the propagator $e^{-iHt}$ is unitary. Any such $H$ is a real linear combination of the Pauli matrices:

$$
\sigma_x = \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix},\quad
\sigma_y = \begin{bmatrix} 0 & -i \\ i & 0 \end{bmatrix},\quad
\sigma_z = \begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}.
$$

This app uses the rotating-frame form common in NMR and driven qubits:

$$
H = \frac{\omega}{2}\sigma_z + \frac{\Omega_x}{2}\sigma_x + \frac{\Omega_y}{2}\sigma_y
= \tfrac{1}{2}\,\vec{\Omega}\cdot\vec{\sigma},
\qquad
\vec{\Omega} = (\Omega_x,\,\Omega_y,\,\omega).
$$

- $\omega$ — detuning (Larmor mismatch) along $z$.
- $\Omega_x$, $\Omega_y$ — transverse drive (Rabi frequencies).

The sign of each coefficient sets the sense of rotation about that axis. On the Bloch sphere the state precesses about $\vec{\Omega}$ at

$$
\omega_R = \sqrt{\omega^2 + \Omega_x^2 + \Omega_y^2},\qquad T = 2\pi/\omega_R.
$$

## Evolution

$H$ is time-independent, so the Schrödinger equation has the closed form:

$$
|\psi(t)\rangle = e^{-iHt}\,|\psi(0)\rangle.
$$

The app shows this state as it evolves: the ket $|\psi(t)\rangle = \alpha|0\rangle + \beta|1\rangle$, the Born-rule probabilities $P(|0\rangle)=|\alpha|^2$ and $P(|1\rangle)=|\beta|^2$ (bars and a plot versus $t$), and the Pauli expectations $\langle\vec{\sigma}\rangle$.
