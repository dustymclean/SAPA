class Pspp < Formula
  desc "Statistical analysis of sampled data"
  homepage "https://www.gnu.org/software/pspp"
  url "https://ftpmirror.gnu.org/gnu/pspp/pspp-2.0.1.tar.gz"
  sha256 "8edbb0f09e8cf8010cad9e0559e0230d7fc5aae4721c756c350554df33024c00"
  head "https://benpfaff.org/~blp/pspp-master/latest-source.tar.gz"

  depends_on "coreutils" => :build
  depends_on "gettext" => :build
  depends_on "pkgconf" => :build
  depends_on "python@3.12" => :build
  depends_on "texinfo" => :build

  depends_on "adwaita-icon-theme"
  depends_on "gdk-pixbuf"
  depends_on "glib"
  depends_on "gsl"
  depends_on "gtk+3"
  depends_on "gtksourceview4"
  depends_on "libiconv"
  depends_on "readline"
  depends_on "spread-sheet-widget"

  def install
    # Ensure python@3.12 is compatible and available
    # This check prevents build failures due to missing or incorrect python versions
    python_exe = Formula["python@3.12"].opt_bin/"python3.12"
    python_version = Utils.safe_popen_read(python_exe, "--version").strip
    unless python_version.include? "3.12"
      odie "SAPA requires python@3.12 for building, but found: #{python_version}. Please ensure python@3.12 is properly installed."
    end

    args = %W[
      --disable-debug
      --without-perl-module
      --without-libiconv-prefix
      --with-libiconv-prefix=#{Formula["libiconv"].opt_prefix}
    ]

    ENV.append "CPPFLAGS", "-I#{Formula["readline"].opt_include}"
    ENV.append "LDFLAGS", "-L#{Formula["readline"].opt_lib}"

    system "./configure", *std_configure_args, *args
    system "make"
    system "make", "check"
    system "make", "install"

    # Documentation Generation Section
    # Automatically generate and install HTML documentation for better user reference.
    # This provides a local, offline-accessible version of the PSPP/SAPA manual.
    system "make", "html"
    system "make", "install-html"
  end

  test do
    # Actually test the executable instead of explicitly failing
    system "#{bin}/pspp", "--version"
  end
end
