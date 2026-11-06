using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Reflection;
[assembly: AssemblyTitle("Tayo Call Launcher")]
[assembly: AssemblyVersion("1.0.0.0")]
internal static class Launcher {
  static string Quote(string value) { return "\"" + value + "\""; }
  static string Run(string file, string args, string root, bool capture=true) {
    var info = new ProcessStartInfo(file, args) { WorkingDirectory=root, UseShellExecute=false, CreateNoWindow=true, RedirectStandardOutput=capture, RedirectStandardError=capture };
    using(var process=Process.Start(info)) {
      if(!capture){process.WaitForExit();if(process.ExitCode!=0)throw new Exception("서버를 시작하지 못했습니다. tayo-call/runtime의 오류 기록을 확인해 주세요.");return "";}
      var output=process.StandardOutput.ReadToEndAsync(); var error=process.StandardError.ReadToEndAsync();
      process.WaitForExit(); string text=output.Result+error.Result;
      if(process.ExitCode!=0)throw new Exception(text);
      return text;
    }
  }
  [STAThread] static int Main(string[] args) {
    bool check=Array.IndexOf(args,"--check")>=0;
    string root=AppDomain.CurrentDomain.BaseDirectory, app=Path.Combine(root,"tayo-call");
    try {
      if(check) {
        string node=Run(Path.Combine(app,"runtime","node","node.exe"),"--version",app);
        string code="import sys,json,av,ctranslate2,faster_whisper,supertonic,onnxruntime,soundfile;print(json.dumps({'python':sys.version.split()[0],'isolated':sys.flags.isolated,'prefix':sys.prefix,'paths':sys.path}))";
        string python=Run(Path.Combine(app,"runtime","python","python.exe"),"-c "+Quote(code),app);
        File.WriteAllText(Path.Combine(app,"runtime","portable-check.log"),"PASS\r\nNode: "+node+"Python: "+python);
      } else {
        string extra=Array.IndexOf(args,"-NoBrowser")>=0?" -NoBrowser":"";
        Run(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe"),"-NoProfile -ExecutionPolicy Bypass -File "+Quote(Path.Combine(app,"launch.ps1"))+extra,app,false);
      }
      return 0;
    } catch(Exception error) {
      try { Directory.CreateDirectory(Path.Combine(app,"runtime")); File.WriteAllText(Path.Combine(app,"runtime","launcher-error.log"),error.ToString()); } catch {}
      if(!check)MessageBox.Show("실행하지 못했습니다. 압축을 모두 푼 뒤 다시 실행해 주세요.\r\n\r\n"+error.Message,"타요 영상통화",MessageBoxButtons.OK,MessageBoxIcon.Error);
      return 1;
    }
  }
}
