using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;

namespace HxLabwrEd2.StaticHelpers;

internal static class DataGridHelper
{
	public static DataGridCell GetCell(int row, int column, DataGrid grid)
	{
		DataGridRow row2 = GetRow(row, grid);
		if (row2 != null)
		{
			DataGridCellsPresenter visualChild = GetVisualChild<DataGridCellsPresenter>(row2);
			DataGridCell dataGridCell = (DataGridCell)visualChild.ItemContainerGenerator.ContainerFromIndex(column);
			if (dataGridCell == null)
			{
				grid.ScrollIntoView(row2, grid.Columns[column]);
				dataGridCell = (DataGridCell)visualChild.ItemContainerGenerator.ContainerFromIndex(column);
			}
			return dataGridCell;
		}
		return null;
	}

	private static T GetVisualChild<T>(Visual parent) where T : Visual
	{
		T val = null;
		int childrenCount = VisualTreeHelper.GetChildrenCount(parent);
		for (int i = 0; i < childrenCount; i++)
		{
			Visual visual = (Visual)VisualTreeHelper.GetChild(parent, i);
			val = visual as T;
			if (val == null)
			{
				val = GetVisualChild<T>(visual);
			}
			if (val != null)
			{
				break;
			}
		}
		return val;
	}

	private static DataGridRow GetRow(int index, DataGrid grid)
	{
		DataGridRow dataGridRow = (DataGridRow)grid.ItemContainerGenerator.ContainerFromIndex(index);
		if (dataGridRow == null)
		{
			grid.ScrollIntoView(grid.Items[index]);
			dataGridRow = (DataGridRow)grid.ItemContainerGenerator.ContainerFromIndex(index);
		}
		return dataGridRow;
	}
}
