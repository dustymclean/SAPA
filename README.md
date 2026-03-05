# SAPA

[![build status](https://github.com/dustymclean/SAPA/actions/workflows/main.yml/badge.svg)](https://github.com/dustymclean/SAPA/actions)

A custom Homebrew tap to install `SAPA` (PSPP) and `spread-sheet-widget` on macOS.

[PSPP Official Website](https://www.gnu.org/software/pspp/)

## Installation

### macOS (Homebrew)

To install `SAPA` via Homebrew, simply add this tap and install:

```bash
brew tap dustymclean/SAPA
brew install pspp
```

For the latest development version, run:

```bash
brew install --head --verbose pspp
```

### Windows

For Windows users, SAPA (PSPP) can be installed using the official installers or via MSYS2:

1. **Official Installer**: Download the latest `.exe` from the [PSPP for Windows](https://sourceforge.net/projects/pspp4windows/) project.
2. **MSYS2**: If you use MSYS2, you can install it using pacman:
   ```bash
   pacman -S mingw-w64-x86_64-pspp
   ```

## Running the Application

To launch the graphical user interface for SAPA, run:

```bash
psppire
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
