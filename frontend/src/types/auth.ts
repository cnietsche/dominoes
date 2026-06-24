export interface PlayerDto {
  id: string;
  name: string;
}

export interface LoginResponse extends PlayerDto {
  token: string;
}

export interface RegisterRequest {
  user: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  user: string;
  password: string;
}
