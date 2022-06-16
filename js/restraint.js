  // 整体
  class TypeIndexSingle extends React.Component {
    constructor(props) {
      super(props);
      // 将数组中每个对象的index赋值为该对象的数组索引值
      let arrType = TypeIndex.types.map((obj, index) => {
        obj.index = index; return obj;
      });
      // 对象Map，存储属性对象，key为name，value为object）
      let mapType = new Map();
      for (let index in arrType)
        mapType.set(arrType[index].name, arrType[index]);
      this.state = {
        type1: null,
        type2: null,
        arrType: arrType,  // 属性数组（一维，存储属性对象）
        mapType: mapType,  // Map，依据name检索属性对象
        arrTypeShow: this.getArrEmpty()  // 展示数组（三维，4×4格，每格存储若干属性）
      };
    }
    // 辅助方法，定位x、y
    matchPosition(isX, n) {
      return isX ? (n <= 0 ? 0 : 2 + Math.log(n) / Math.log(2)) :
        n <= 0 ? 3 : 1 - Math.log(n) / Math.log(2);
    }
    // 得到空的4×4×0数组
    getArrEmpty() {
      let arr = new Array(4);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(4);
        for (let j = 0; j < arr[i].length; j++) {
          arr[i][j] = [];
        }
      }
      return arr;
    }
    // 绑定给单格属性的事件
    clickType = (typeIndex) => {
      let arrTypeShow = this.getArrEmpty()
      let type = this.state.arrType[typeIndex];
      for (let objName in type.against) {
        let x = this.matchPosition(true, type.against[objName].atk);
        let y = this.matchPosition(false, type.against[objName].def);
        arrTypeShow[y][x].push({
          index: this.state.mapType.get(objName).index,
          color: this.state.mapType.get(objName).color,
          name: this.state.mapType.get(objName).name,
          description: this.state.mapType.get(objName).description
        });
      }
      this.setState({
        type1: type,
        arrTypeShow: arrTypeShow
      });
    }
    render() {
      return [
        <TypeShow key='2'
          arrTypeShow={this.state.arrTypeShow}
          onClick={(typeIndex) => this.clickType(typeIndex)}
          typeSelected={this.state.type1} />,
        <TypeTitle key='1'
          arrType={this.state.arrType}
          onClick={(typeIndex) => this.clickType(typeIndex)}
          typeSelected={this.state.type1} />
      ];
    };
  }

  // 标题区组件|TypeTitle
  class TypeTitle extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        count: 2  // count为每行个数
      }
    }
    componentDidMount() {
      document.addEventListener('keydown', this.hotkey);
    }
    componentWillUnmount() {
      document.removeEventListener('keydown', this.hotkey);
    }
    // 监听事件
    hotkey = (e) => {
      let index = null;
      if (this.props.typeSelected === null) {
        if (e.keyCode === 37 || e.keyCode === 38)
          index = this.props.arrType.length - 1;
        else if (e.keyCode === 39 || e.keyCode === 40)
          index = 0;
      }
      else {
        let count = this.state.count;
        index = this.props.typeSelected.index;
        switch (e.keyCode) {
          case 37:  // left arrow
            if (index > 0 && index % count > 0)
              index = index - 1;
            break;
          case 38:  // up arrow
            if (index - count >= 0)
              index = index - count;
            break;
          case 39:  // right arrow
            if (index < this.props.arrType.length - 1 && index % count < count - 1)
              index = index + 1;
            break;
          case 40:  // down arrow
            if (index + count < this.props.arrType.length)
              index = index + count;
            break;
          default: break;
        }
      }
      if (index !== null) this.props.onClick(index);
    }
    // 逐两个创建
    createCell = () => {
      let arrTr = [];
      let arrResult = [];
      let arrType = this.props.arrType;
      for (let index in arrType) {
        let typeSelected = this.props.typeSelected;
        let isChecked = (typeSelected !== null) ?
          (String(typeSelected.index) === index) : false;
        arrTr.push(
          <td key={index}>
            <input type='radio' name='type'
              id={index}
              checked={isChecked}
              onChange={() => this.props.onClick(index)} />
            <TypeLabel for={index}
              color={arrType[index].color}
              name={arrType[index].name} />
          </td>
        );
        if (index % this.state.count === this.state.count - 1) {
          arrResult.push(<tr key={index}>{arrTr}</tr>);
          arrTr = [];
        }
      }
      if (arrTr.length > 0)
        arrResult.push(<tr key={-1}>{arrTr}</tr>);
      return arrResult;
    }
    render() {
      return (
        <table className='TypeTitle'>
          <tbody>{this.createCell()}</tbody>
        </table>
      );
    }
  }

  // 展示区组件|TypeShow
  class TypeShow extends React.Component {
    // 逐行创建
    createShowCells = (row) => {
      let arrResult = [];
      let arrRow = this.props.arrTypeShow[row];
      for (let i = 0; i < arrRow.length; i++) {
        let arrItem = arrRow[i];
        arrItem = arrItem.map((value, key) => {
          return (
            <TypeLabel key={key}
              color={value.color}
              name={value.name}
              onClick={() => this.props.onClick(value.index)} />
          );
        });
        arrResult.push(<td key={i}>{arrItem}</td>);
      }
      arrResult.push(<td key={-1} className="blank">※</td>);
      return arrResult;
    }
    // 创建左下角属性标签
    createTypeSelected = () => {
      let type = this.props.typeSelected;
      return (type === null ? null :
        <TypeLabel color={type.color} name={type.name} />);
    }
    render() {
      return (
        <table className='TypeShow'>
          <tbody>
            <tr>
              <td className="blank yLine">D</td><td className="blank">※</td>
              <td className="blank">※</td><td className="blank">※</td>
              <td className="blank">※</td><td className="blank">※</td>
            </tr>
            <tr>
              <td className='effDouble yLine'>×2</td>
              {this.createShowCells(0)}
            </tr>
            <tr>
              <td className='effNormal yLine'>×1</td>
              {this.createShowCells(1)}
            </tr>
            <tr>
              <td className='effHalf yLine'>×½</td>
              {this.createShowCells(2)}
            </tr>
            <tr>
              <td className='effZero yLine'>×0</td>
              {this.createShowCells(3)}
            </tr>
            <tr className='xLine'>
              <td className="blank yLine">
                {this.createTypeSelected()}
              </td>
              <td className='effZero'>×0</td><td className='effHalf'>×½</td>
              <td className='effNormal'>×1</td><td className='effDouble'>×2</td>
              <td className="blank">A</td>
            </tr>
          </tbody>
        </table>
      );
    }
  }

  // 属性标签|TypeLabel
  function TypeLabel(props) {
    return (
      <label className='TypeLabel'
        style={{ background: props.color }}
        onClick={props.onClick}
        htmlFor={props.for}>
        {props.name}
      </label>
    );
  }

  ReactDOM.render(<TypeIndexSingle />, document.getElementById('TypeIndexSingle'));