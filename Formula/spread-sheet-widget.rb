class SpreadSheetWidget < Formula
  desc "Library for Gtk+ for viewing and manipulating 2 dimensional tabular data"
  homepage "https://www.gnu.org/software/ssw/"
  url "https://alpha.gnu.org/gnu/ssw/spread-sheet-widget-0.10.tar.gz"
  sha256 "80692ec350271995e147dc759929cdd79d3b645e6b5efaa6b57f4d2d05e847e5"
  revision 1

  depends_on "pkgconf" => [:build, :test]
  depends_on "glib"
  depends_on "gtk+3"

  # see: https://savannah.gnu.org/bugs/?67198
  patch do
    url "https://github.com/fredowski/ssw/commit/87fa64cbc11471d6c6a292e0cae3292484253de9.diff"
    sha256 "9f9c42e5db0937a570625549fca1388413926a003be588fba8c105eec2d1f62e"
  end

  def install
    system "./configure", *std_configure_args, "--disable-silent-rules"
    system "make", "install"
  end

  test do
    (testpath/"test.c").write <<~EOS
      #include <gtk/gtk.h>
      #include "ssw-sheet.h"

      int main(int argc, char *argv[]) {
        gtk_init (&argc, &argv);
        GtkWidget *sheet = ssw_sheet_new ();
        gtk_widget_destroy(sheet);
        return 0;
      }
    EOS
    
    # Use pkg-config to dynamically grab all necessary flags
    flags = shell_output("pkg-config --cflags --libs spread-sheet-widget gtk+-3.0 glib-2.0").chomp.split
    system ENV.cc, "test.c", "-o", "test", *flags
    system "./test"
  end
end
