# Quantum State Evolution

Interactive single-qubit visualizer: Schrödinger evolution under a tunable Hamiltonian, rendered on the Bloch sphere.

<img width="1630" height="1285" alt="image" src="https://github.com/user-attachments/assets/7db3832d-299f-45c8-89b0-ec2be358bf7d" />

## Physics

The qubit evolves under:

\[
H = \frac{\omega}{2}\sigma_z + \frac{\Omega}{2}\sigma_x
\]

\[
|\psi(t)\rangle = e^{-iHt}|\psi(0)\rangle
\]

Evolution uses analytic matrix exponentiation of the 2×2 Hermitian Hamiltonian (exact unitary, stable scrubbing).

