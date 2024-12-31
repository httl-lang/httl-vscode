import { Action, Model, connect, store } from "react-storm";
import { commutator } from "../../services/commutator";
import { HttlOutputViewProps } from "./httl-output";
import { Example } from "../../components/examples";
import { AppModel } from "../app.model";

@Model()
export class ResponseModel {

  public viewData?: HttlOutputViewProps;

  public map = new Map<string, HttlOutputViewProps>();
  public currentFile?: string;

  constructor(
    private readonly appModel = store(AppModel)
  ) { }

  public init() {
    commutator.onSetProgress(({ file, payload: active }) => {
      let viewData = this.map.get(file);
      viewData = { inProgress: active, output: viewData?.output };
      this.setViewData(viewData);
    });

    commutator.onChangeActiveEditor(({ file }) => {
      this.currentFile = file;
      const res = this.map.get(file);
      this.setViewData(res);
    });

    commutator.onSetResponse(({ payload, file }) => {
      this.currentFile = file;
      const viewData = { inProgress: false, output: payload };
      this.map.set(file, viewData);
      this.setViewData(viewData);
    });

    commutator.onCloseResponse(({ file }) => {
      this.map.delete(file);
    });
  }

  @Action()
  public setViewData(viewData?: HttlOutputViewProps) {
    this.viewData = viewData;
    if (!!viewData) {
      console.log('setViewData', viewData);
      this.appModel.displayResponse(this.currentFile!);
    } else {
      this.appModel.displayDefault();
    }
  }

  public highlightCode(source: { start: number, end: number }, scroll = false) {
    vscode.postMessage({
      command: "code-highlight",
      file: this.currentFile,
      payload: source
    });

    if (scroll) {
      this.scrollToCode(source);
    }
  }

  public scrollToCode(source: { start: number, end: number }) {
    vscode.postMessage({
      command: "code-scroll",
      file: this.currentFile,
      payload: source
    });
  }

  public createExample(example: Example) {
    vscode.postMessage({
      command: 'create-example',
      file: this.currentFile,
      payload: `# ${example.title}\n\n# ${example.description}\n${example.code}`
    });
  }
}

const [ResponseContext, useResponseModel] = connect(ResponseModel);

export { ResponseContext, useResponseModel };