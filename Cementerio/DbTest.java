import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbTest {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/cementerio_db";
        String user = "postgres";
        String password = "andercOn2209";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            System.out.println("Conexión exitosa a la base de datos.");
            ResultSet rs = stmt.executeQuery("SELECT * FROM usuario;");
            
            int count = 0;
            while (rs.next()) {
                System.out.println("Usuario ID: " + rs.getLong("id_usuario") + ", Correo: " + rs.getString("correo") + ", Rol: " + rs.getString("rol"));
                count++;
            }
            System.out.println("Total usuarios: " + count);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
